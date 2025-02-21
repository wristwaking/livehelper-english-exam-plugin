const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1300,
        height: 730,
        frame: false,
        resizable: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            webSecurity: false,
            devTools: false
        }
    })
    mainWindow.webContents.on('devtools-opened', () => {
        mainWindow.webContents.closeDevTools();
    });
    mainWindow.webContents.loadFile(path.join(__dirname, 'pages', 'main', 'main.html'));
    mainWindow.setMenuBarVisibility(false)
    return mainWindow
}

app.disableHardwareAcceleration()

app.whenReady().then(() => {
    mainWindow = createWindow();
});

ipcMain.on('resize-app', (event, params) => {
    mainWindow.minimize()
})

ipcMain.on('close-app', (event, params) => {
    mainWindow.close()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('close-app', (event, params) => {
    mainWindow.close()
})