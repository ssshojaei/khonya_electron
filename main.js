const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron')
const windowSateKeeper = require('electron-window-state')

let mainWin
let tray
let status = 'پخش'

const createWindow = () => {
	let stateMainWindow = windowSateKeeper({
		defaultWidth: 1000,
		defaultHeight: 700,
	})
	let stateSplashWindow = windowSateKeeper({
		defaultWidth: 1000,
		defaultHeight: 700,
	})
	mainWin = new BrowserWindow({
		width: stateMainWindow.width,
		height: stateMainWindow.height,
		x: stateMainWindow.x,
		y: stateMainWindow.y,
		show: false,
		webPreferences: {
			nodeIntegration: true,
		},
	})
	let splashWin = new BrowserWindow({
		width: 600,
		height: 400,
		x: stateSplashWindow.x,
		y: stateSplashWindow.y,
		parent: mainWin,
		frame: false,
	})
	mainWin.loadFile('./views/index.html')
	splashWin.loadFile('./views/splash.html')
	splashWin.center()

	stateMainWindow.manage(mainWin)
	stateSplashWindow.manage(splashWin)

	setTimeout(() => {
		mainWin.show()
		splashWin.close()
	}, 2000)

	// mainWin.on('ready-to-show', () => {
	//     mainWin.show()
	//     splashWin.close()
	// })
}

const setContext = () => {
	const contextMenu = Menu.buildFromTemplate([
		{
			label: status,
			click: () => mainWin.webContents.send('controller', 'play'),
		},
		{
			label: 'برو جلو',
			click: () => mainWin.webContents.send('controller', 'next'),
		},
		{
			label: 'بیا عقب',
			click: () => mainWin.webContents.send('controller', 'prev'),
		},
	])
	tray.setContextMenu(contextMenu)
}

ipcMain.on('setStatus', (e, arg) => {
	status = arg
	setContext()
})

const createTray = () => {
	tray = new Tray('./static/images/icon.png')
	setContext()
}

const createMenu = () => {
	const template = [
		{
			label: 'File',
			submenu: [
				{
					label: 'Open',
					click: () => mainWin.webContents.send('openFiles'),
				},
			],
		},
	]
	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)
}

app.on('ready', () => {
	createWindow()
	createTray()
	createMenu()
})
