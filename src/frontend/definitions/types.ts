export interface Window {

}

export interface FileNode {
    name: string;
    children: FileNode[];
}

export interface TextInjection {
    replacementString: string; // ~{text}~
    requestText: string;
    files: string[];
}

export interface Module {
    name: string;
    description: string;
    requirements: string[];
    uuid: string;
    textInjections: TextInjection[];
    path: string;
}

export interface VersionedModule {
    module: Module;
    version: number;
}

export interface ProjectInfo {
    loadedModules: VersionedModule[];
}