const { ipcRenderer } = require("electron");
import * as types from './types';

export const openFolderDialog = async (path: string) => {
    const result: string[] = await ipcRenderer.invoke('openFolderDialog', path);
    return result;
}

export const enumerateDirectory = async (path: string) => {
    const result: types.FileNode[] = await ipcRenderer.invoke('enumerateDirectory', path);
    return result;
}

export const loadInfoFile = async (path: string) => {
    const result: types.ProjectInfo = await ipcRenderer.invoke('loadInfoFile', path);
    return result;
}

export const loadAvailableModules = async (rootPath: string) => {
    const result: types.VersionedModule[] = await ipcRenderer.invoke('loadAvailableModules', rootPath);
    return result;
}

export const applyModule = async (projectPath: string, module: types.Module, injections: string[]) => {
    const result: string = await ipcRenderer.invoke('applyModule', projectPath, module, injections);
    return result;
}

export const removeModule = async (projectPath: string, module: types.Module) => {
    const result: string = await ipcRenderer.invoke('removeModule', projectPath, module);
    return result;
}

export const updateDbType = async (projectPath: string, dbType: string) => {
    await ipcRenderer.invoke('updateDbType', projectPath, dbType);
}

export const runNpmInstall = async (projectPath: string) => {
    ipcRenderer.invoke('runNpmInstall', projectPath);
}