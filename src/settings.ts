import { App, PluginSettingTab, Setting } from "obsidian";
import GyazoObsidianUploader from "./main";

export interface MySettings {
	accessToken: string;
	collectionId: string;
	imageDisplayWidth: string;
}

export const DEFAULT_SETTINGS: MySettings = {
	accessToken: "",
	collectionId: "",
	imageDisplayWidth: "",
};

export class GyazoUploaderSettingTab extends PluginSettingTab {
	plugin: GyazoObsidianUploader;

	constructor(app: App, plugin: GyazoObsidianUploader) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Access token")
			.setDesc("It's a secret")
			.addText(
				(text) =>
					(text
						.setPlaceholder("Enter your secret")
						.setValue(this.plugin.settings.accessToken)
						.onChange(async (value) => {
							this.plugin.settings.accessToken = value;
							await this.plugin.saveSettings();
						}).inputEl.type = "password"),
			);
		new Setting(containerEl)
			.setName("Collection ID")
			.setDesc("Collection ID")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.collectionId)
					.onChange(async (value) => {
						this.plugin.settings.collectionId = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName("Image display width")
			.setDesc("Number")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.imageDisplayWidth)
					.onChange(async (value) => {
						this.plugin.settings.imageDisplayWidth = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
