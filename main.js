const path = require('path');
const url = require('url');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');

let win;

function createWindow() {
	win = new BrowserWindow({
		width: 1200,
		height: 800,
		autoHideMenuBar: true,
		// fullscreen: true,
		icon: path.join(__dirname, '/img/logo.png'),
		// titleBarStyle: 'hidden',
		// titleBarOverlay: {
		// 	color: '#333333',
		// 	symbolColor: '#ffffff'
		// },
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	win.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true,
	}));

	win.webContents.openDevTools();

	ipcMain.handle('show-question', (event, options) => {
		return dialog.showMessageBox(options);
	})

	ipcMain.handle('save-file', (event, options) => {
		return dialog.showSaveDialog(options);
	})

	win.on('closed', () => {
		win = null;
	});
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	app.quit();
});