const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
	invoke: async (channel, data) => {
		let validChannels = [
			'check-file',
			'read-file',
			'write-file',
			'rename-file',
			'delete-file',
			'read-dir',
			'create-dir',
			'export-to-pdf',
			'show-question',
			'get-app-version',
		];
		if (validChannels.includes(channel)) {
			if (Array.isArray(data)) {
				return await ipcRenderer.invoke(channel, ...data);
			} else {
				return await ipcRenderer.invoke(channel, data);
			}
		}
	},
})


