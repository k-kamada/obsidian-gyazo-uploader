import { Editor, getAllTags, Notice, Plugin, requestUrl } from "obsidian";
import { DEFAULT_SETTINGS, MySettings, SampleSettingTab } from "./settings";

// Remember to rename these classes and interfaces!

export default class GyazoObsidianUploader extends Plugin {
	settings: MySettings;

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			this.app.workspace.on(
				"editor-drop",
				async (event: DragEvent, editor: Editor) => {
					event.preventDefault();

					const files = event.dataTransfer?.files;
					if (!files || files.length === 0) return;
					if (files[0] && files[0].type.startsWith("image/")) {
						// ドラッグ＆ドロップした位置にプレイスホルダーを挿入
						const dropPos = editor.getCursor();
						const placeholderText = `[!INFO] Uploading image to Gyazo...(timestamp: ${Date.now()})`;
						editor.replaceRange(placeholderText, dropPos);

						const formData = new FormData();
						formData.append(
							"access_token",
							this.settings.accessToken,
						);
						formData.append("imagedata", files[0]);
						if (this.settings.collectionId) {
							formData.append(
								"collection_id",
								this.settings.collectionId,
							);
						}
						formData.append("app", "Obsidian");

						const activeFile = this.app.workspace.getActiveFile();

						formData.append("title", activeFile?.basename || "");
						const cache = activeFile
							? this.app.metadataCache.getFileCache(activeFile)
							: null;
						const tags: string[] = cache
							? getAllTags(cache) || []
							: [];
						formData.append(
							"desc",
							`filename: ${files[0].name}\ntags: ${tags.join(" ")}`,
						);

						const tempResponse = new Response(formData);

						const body = await tempResponse.arrayBuffer();
						const contentType =
							tempResponse.headers.get("content-type") || "";

						const requestParam = {
							url: "https://upload.gyazo.com/api/upload",
							method: "POST",
							headers: {
								Authorization: `Bearer ${this.settings.accessToken}`,
								"Content-Type": contentType,
							},
							body: body,
						};
						try {
							const uploadResponse =
								await requestUrl(requestParam);
							const imageId: string =
								uploadResponse.json.image_id;

							new Notice(
								"[Gyazo-Uploader] Upload finished. Waiting for OCR...",
							);
							// OCRの処理を待つため10秒ウェイト
							await new Promise((resolve) =>
								setTimeout(resolve, 10000),
							);

							const infoResponse = await requestUrl({
								url: `https://api.gyazo.com/api/images/${imageId}`,
								method: "GET",
								headers: {
									Authorization: `Bearer ${this.settings.accessToken}`,
								},
							});

							const ocrText = (
								infoResponse.json.metadata.ocr
									.description as string
							).replace(/\n/g, "");

							const url = infoResponse.json.url;

							const resultText = `![ocr:"${ocrText}"${this.settings.imageDisplayWidth ? `|${this.settings.imageDisplayWidth}` : ""}](${url})`;

							const result = replacePlaceholder(
								editor,
								placeholderText,
								resultText,
							);

							new Notice("[Gyazo-Uploader] Generate image link");
						} catch (error) {
							console.error("Error:", error);
							replacePlaceholder(
								editor,
								placeholderText,
								"[INFO!] Failed to upload",
							);
							new Notice(
								"[Gyazo-Uploader] Error: failed to upload an image to Gyazo",
							);
						}
					}
				},
			),
		);

		const replacePlaceholder = (
			editor: Editor,
			placeholderText: string,
			replacement: string,
		) => {
			const content = editor.getValue();
			const lines = content.split("\n");

			for (let i = 0; i < lines.length; i++) {
				if (lines[i]?.includes(placeholderText)) {
					const startChar = lines[i]?.indexOf(placeholderText) || 0;
					const from = { line: i, ch: startChar };
					const to = {
						line: i,
						ch: startChar + placeholderText.length,
					};

					editor.replaceRange(replacement, from, to);
					return true;
				}
			}
			return false;
		};

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MySettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
