// Modules to control application life and create native browser window
import { app, BrowserWindow, Menu, Tray, ipcMain, session, dialog } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as os from 'os';
import * as fs from 'fs';
import * as beautify from 'beautify';

const isPackaged = require('electron-is-packaged').isPackaged;

app.commandLine.appendSwitch('remote-debugging-port', '9999');
app.setAppUserModelId(process.execPath);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let tray;
let isQuiting = false;

const reactDevToolsPath = path.join(os.homedir(), // verify this path
  "\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Extensions\\fmkadmapgofadopljbjfkapdkoienihi\\4.10.1_0"
);

async function createWindow () {
	// Create the browser window.
	if (process.env.NODE_ENV !== 'development' || app.isPackaged || isPackaged) {
		Menu.setApplicationMenu(null);
	} else {
		//await session.defaultSession.loadExtension(reactDevToolsPath);
	}
	mainWindow = new BrowserWindow({
		width: 900,
		height: 900,
		icon: path.resolve(__dirname, './favicon.ico'),
		webPreferences: {
			//sandbox: true,
			nodeIntegration: true,
			contextIsolation: false,
			backgroundThrottling: false
		}
	});

	// Open the DevTools.
	//mainWindow.webContents.openDevTools()

	// Emitted when the window is closed.
	mainWindow.on('closed', function(e) {
		mainWindow = null;
	})

	if (process.env.NODE_ENV === 'development' && !app.isPackaged && !isPackaged) {
		mainWindow.loadURL(`http://localhost:4000`);
	} else {
		mainWindow.loadURL(
			`file:\\\\${__dirname}\\index.html`
		);
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  	app.quit()
} else {
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		// Someone tried to run a second instance, we should focus our window.
		if (mainWindow) {
		if (mainWindow.isMinimized()) mainWindow.restore()
		if (!mainWindow.isVisible()) mainWindow.show()
			mainWindow.focus()
		}
	})

	app.on('ready', createWindow)
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) createWindow()
})

// begin app code
// -----------------------------------------------------

ipcMain.handle('openFolderDialog', async (event, path) => {
	const result = await dialog.showOpenDialog(mainWindow, {
		properties: ["openDirectory"],
		defaultPath: path
	});
	return result.filePaths;
});

const enumerateDirectory = (path, fileList) => {
	const files = fs.readdirSync(path);
	
	files.forEach((file) => {
		const newPath = `${path}/${file}`;
		if (fs.statSync(newPath).isDirectory()) {
			if (file != "node_modules") {
				fileList.push({ name: file, children: [] });
				enumerateDirectory(newPath, fileList[fileList.length - 1].children);
			}
		} else {
			fileList.push({ name: file, children: undefined });
		}
	});
}

ipcMain.handle('enumerateDirectory', async (event, path) => {
	let fileList = [];
	enumerateDirectory(path, fileList);
	return fileList;
});

const loadInfoFile = (path) => {
	try {
		const fileData = fs.readFileSync(`${path}/wamm.json`);
		return JSON.parse(fileData);
	} catch {
		return {
			loadedModules: [],
			dbType: "sqlserver"
		};
	}
}

ipcMain.handle('loadInfoFile', async (event, path) => {
	return loadInfoFile(path);
});

const getValidVersions = (modulePath) => {
	const moduleFiles = fs.readdirSync(modulePath);
	let validVersions = [];
	moduleFiles.forEach((file) => {
		const newPath = `${modulePath}/${file}`;
		if (fs.statSync(newPath).isDirectory()) {
			const version = parseInt(file);
			if (!isNaN(version))
				validVersions.push(version);
		}
	});
	validVersions.sort();
	return validVersions;
}

const searchForModules = (path, moduleList) => {
	const files = fs.readdirSync(path);
	
	if (files.includes("waminfo.json")) { // is a module
		const fileData = fs.readFileSync(`${path}/waminfo.json`);
		const moduleInfo = JSON.parse(fileData);
		const validVersions = getValidVersions(path);
		if (validVersions.length > 0) {
			moduleInfo["path"] = path;
			moduleList.push({ module: moduleInfo, version: validVersions[validVersions.length - 1] });
		}
	} else {
		files.forEach((file) => {
			const newPath = `${path}/${file}`;
			if (fs.statSync(newPath).isDirectory()) {
				if (file != "node_modules") {
					searchForModules(newPath, moduleList);
				}
			}
		});
	}
}

ipcMain.handle('loadAvailableModules', async (event, rootPath) => {
	let moduleList = [];
	searchForModules(rootPath, moduleList);
	return moduleList;
});

ipcMain.handle('applyModule', async (event, projectPath, module, injections) => {
	// intialize folder structure
	fs.mkdirSync(`${projectPath}/WAMM/Migrations/`, { recursive: true });

	let info = loadInfoFile(projectPath);
	const loadedModuleIndex = info.loadedModules.findIndex(m => m.module.uuid == module.uuid);
	let currentVersion = -1;
	if (loadedModuleIndex != -1) {
		currentVersion = info.loadedModules[loadedModuleIndex].version;
	}

	const validVersions = getValidVersions(module.path);

	if (validVersions.length == 0) return "Module has no associated versions";

	for (let i = 0; i < validVersions.length; i++) {
		if (validVersions[i] <= currentVersion) // skip lower upgrades
			continue;

		const versionFiles = fs.readdirSync(`${module.path}/${validVersions[i]}`);

		// check for db upgrades
		switch (info.dbType) {
			default:
			case "sqlserver": {
				if (versionFiles.includes("upgrade-sqlserver.sql")) {
					fs.copyFileSync(`${module.path}/${validVersions[i]}/upgrade-sqlserver.sql`, `${projectPath}/WAMM/Migrations/${module.uuid}_${validVersions[i]}.sql`);
				}
			} break;
			case "mysql": {
				if (versionFiles.includes("upgrade-mysql.sql")) {
					fs.copyFileSync(`${module.path}/${validVersions[i]}/upgrade-mysql.sql`, `${projectPath}/WAMM/Migrations/${module.uuid}_${validVersions[i]}.sql`);
				}
			}
		}

		if (i == validVersions.length - 1) { // most recent version
			// copy all other files
			versionFiles.forEach((file) => {
				const newPath = `${module.path}/${validVersions[i]}/${file}`;
				if (!fs.statSync(newPath).isDirectory() && !file.endsWith("sql") && file != "specialization.json") {
					fs.mkdirSync(`${projectPath}/WAMM/${module.uuid}`, { recursive: true });
					fs.copyFileSync(newPath, `${projectPath}/WAMM/${module.uuid}/${file}`);
				}
			});

			// update info file
			if (loadedModuleIndex == -1) {
				info.loadedModules.push({
					module: module,
					version: validVersions[i]
				});
			} else {
				info.loadedModules[loadedModuleIndex].version = validVersions[i];
				info.loadedModules[loadedModuleIndex].module = module;
			}
			fs.writeFileSync(`${projectPath}/wamm.json`, JSON.stringify(info));
			
			// text injections (todo: optimize this)
			module.textInjections.forEach((t, i) => {
				t.files.forEach((f) => {
					let fileData = fs.readFileSync(`${projectPath}/WAMM/${module.uuid}/${f}`).toString();
					fileData = fileData.replaceAll(`~{${t.replacementString}}~`, injections[i]);
					fs.writeFileSync(`${projectPath}/WAMM/${module.uuid}/${f}`, fileData);
				});
			});

			// update package.json file if the module contains a package.json
			if (versionFiles.includes("package.json")) {
				try {
					const packageFileData = fs.readFileSync(`${projectPath}/package.json`);
					let packageJSON = JSON.parse(packageFileData);
					if (packageJSON.hasOwnProperty("dependencies") && !packageJSON.dependencies.hasOwnProperty(module.name)) {
						packageJSON.dependencies[module.name] = `file:WAMM/${module.uuid}`;
						fs.writeFileSync(`${projectPath}/package.json`, beautify(JSON.stringify(packageJSON), { format: "json" }));
					}
				} catch {}
			}
		}
	}
	return "Done";
});

ipcMain.handle('removeModule', async (event, projectPath, module) => {
	let info = loadInfoFile(projectPath);
	const loadedModuleIndex = info.loadedModules.findIndex(m => m.module.uuid == module.uuid);

	if (loadedModuleIndex == -1) return;

	// delete files
	fs.rmdirSync(`${projectPath}/WAMM/${module.uuid}`, { recursive: true, force: true });

	// delete associated migrations
	const migrations = fs.readdirSync(`${projectPath}/WAMM/Migrations`);
	migrations.forEach((file) => {
		if (file.includes(module.uuid))
			fs.rmSync(`${projectPath}/WAMM/Migrations/${file}`);
	});

	// update info file
	info.loadedModules.splice(loadedModuleIndex, 1);
	fs.writeFileSync(`${projectPath}/wamm.json`, JSON.stringify(info));

	// update package.json file
	try {
		const packageFileData = fs.readFileSync(`${projectPath}/package.json`);
		let packageJSON = JSON.parse(packageFileData);
		if (packageJSON.dependencies.hasOwnProperty(module.name)) {
			delete packageJSON.dependencies[module.name];
			fs.writeFileSync(`${projectPath}/package.json`, beautify(JSON.stringify(packageJSON), { format: "json" }));
		}
	} catch {}

	return "Done";
});

ipcMain.handle('updateDbType', async (event, projectPath, dbType) => {
	let info = loadInfoFile(projectPath);
	info.dbType = dbType;
	fs.writeFileSync(`${projectPath}/wamm.json`, JSON.stringify(info));
});