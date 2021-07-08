import { Checkbox, DialogTitle } from '@material-ui/core';
import { Button, Paper, TextField, Typography, Select, MenuItem, Modal, Dialog } from '@material-ui/core';
import React from 'react';
import * as api from '../definitions/api';
import * as types from '../definitions/types';
import * as theme from '../theme';

interface Props {
    projectPath: string;
    refreshTree: () => void;
}

const ContainedCheckbox = () => {
    const [checked, setChecked ] = React.useState(false);
    return <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} style={{ marginTop: "auto", marginBottom: "auto" }} />
}

export const ModuleList = (props: Props) => {
    const [info, setInfo] = React.useState<types.ProjectInfo | undefined>(undefined);
    const [availableModules, setAvailableModules] = React.useState<types.VersionedModule[]>([]);
    const [injections, setInjections] = React.useState<string[]>([]);
    const [modalState, setModalState] = React.useState({
        open: false,
        moduleIndex: 0,
    });
    const [loadedModalState, setLoadedModalState] = React.useState({
        open: false,
        moduleIndex: 0,
    });
    const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
    const [modulesPath, setModulesPath] = React.useState("");

    const loadInfoFile = () => {
        if (props.projectPath == "") return;
        api.loadInfoFile(props.projectPath).then(info => {
            setInfo(info);
        })
    }

    const loadAvailableModules = (rootPath: string) => {
        if (rootPath == "") return;
        api.loadAvailableModules(rootPath).then(list => {
            setAvailableModules(list);
        });
    }

    const tryApplyModule = (index: number) => {
        setInjections(new Array(availableModules[index].module.textInjections.length));
        setModalState({
            open: true,
            moduleIndex: index,
        });
    }

    const applyModule = (index: number) => {
        if (props.projectPath == "") return;
        api.applyModule(props.projectPath, availableModules[index].module, injections).then(result => {
            setInjections([]);
            console.log(result);
            refreshData();
        });
    }

    const removeModule = () => {
        if (props.projectPath == "" || !info) return;
        closeLoadedModal();
        setConfirmModalOpen(false);
        api.removeModule(props.projectPath, info.loadedModules[loadedModalState.moduleIndex].module).then(result => {
            console.log(result);
            refreshData();
        });
    }

    React.useEffect(loadInfoFile, [props.projectPath]);
    React.useEffect(() => {
        loadAvailableModules("D:/Projects/WebAppModuleManager/modules");
        const savedModulePath = localStorage.getItem("saved_module_path");
        if (savedModulePath) setModulesPath(savedModulePath);
    }, []);

    const handleInjectionsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, i: number) => {
        let newArr = injections;
        injections[i] = e.target.value;
        setInjections(newArr);
    }

    const closeModal = () => {
        setModalState({...modalState, open: false});
        setInjections([]);
    }

    const confirmModal = () => {
        applyModule(modalState.moduleIndex);
        closeModal();
    }

    const closeLoadedModal = () => {
        setLoadedModalState({...loadedModalState, open: false });
    }

    const refreshData = () => {
        loadInfoFile();
        loadAvailableModules("D:/Projects/WebAppModuleManager/modules");
        props.refreshTree();
    }

    const mapAvailableModules = () => {
        if (!info) return [];
        let available: JSX.Element[] = [];
        availableModules.map((e, i) => {
            if (info.loadedModules.findIndex(m => m.module.uuid == e.module.uuid) == -1)
                available.push(<Button key={i}onClick={() => tryApplyModule(i)} variant="contained">{e.module.name}</Button>)
        });
        return available;
    }

    const mapAvailableUpgrades = () => {
        if (!info) return [];
        let available: JSX.Element[] = [];
        availableModules.map((e, i) => {
            if (info.loadedModules.findIndex(m => m.module.uuid == e.module.uuid && m.version < e.version) != -1)
                available.push(<Button key={i}onClick={() => tryApplyModule(i)} variant="contained">{e.module.name}</Button>)
        });
        return available;
    }

    const updateModulePath = () => {
        api.openFolderDialog(modulesPath).then((data) => {
            if (data.length == 0) return;
            setModulesPath(data[0]);
            localStorage.setItem("saved_module_path", data[0]);
        });
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem", gap: "0.5rem" }}>
                <TextField
                    fullWidth
                    label="Modules folder location"
                    variant="outlined"
                    value={modulesPath}
                    disabled
                />
                <Button variant="outlined" onClick={updateModulePath}>Change</Button>
            </div>
            {props.projectPath != "" && <Button variant="contained" fullWidth onClick={refreshData} style={{ marginBottom: "1rem" }}>Refresh</Button>}
            {info &&
                <div style={{ display: "flex", gap: "1rem" }}>
                    <div>
                        <Typography color="textPrimary">Loaded Modules</Typography>
                        <hr />
                        {info.loadedModules.length > 0 ?
                            info.loadedModules.map((e, i) => {
                                return (
                                    <Button key={i}onClick={() => setLoadedModalState({ open: true, moduleIndex: i })} variant="contained">{e.module.name}</Button>
                                );
                            })
                            : <Typography color="textPrimary">None</Typography>
                        }
                    </div>
                    <div>
                        <Typography color="textPrimary">Available Modules</Typography>
                        <hr />
                        {mapAvailableModules().length > 0 ?
                            mapAvailableModules()
                            : <Typography color="textPrimary">None</Typography>
                        }
                    </div>
                    <div>
                        <Typography color="textPrimary">Upgrades</Typography>
                        <hr />
                        {mapAvailableUpgrades().length > 0 ?
                            mapAvailableUpgrades()
                            : <Typography color="textPrimary">None</Typography>
                        }
                    </div>
                </div>
            }
            <Dialog
                open={modalState.open}
                onClose={closeModal}
            >
                {modalState.open &&
                    <React.Fragment>
                        <DialogTitle>Setup Module</DialogTitle>
                        <div style={{ padding: "1rem" }}>
                            <Typography><b>Version:</b> {availableModules[modalState.moduleIndex].version}</Typography>
                            <Typography><b>Description:</b> {availableModules[modalState.moduleIndex].module.description}</Typography>
                            <Typography><b>Requirements</b></Typography>
                            {availableModules[modalState.moduleIndex].module.requirements.map((r, i) => {
                                return (
                                    <div key={i} style={{ display: "flex" }}>
                                        <ContainedCheckbox />
                                        <p dangerouslySetInnerHTML={{__html: `${r.replaceAll("\n", "<br />")}`}} />
                                    </div>
                                );
                            })}
                            <br />
                            <Typography><b>Additional Setup</b></Typography>
                            {availableModules[modalState.moduleIndex].module.textInjections.map((e, i) => {
                                return (
                                    <div key={i}>
                                        <Typography>{e.requestText}</Typography>
                                        <TextField
                                            fullWidth
                                            value={injections[i]}
                                            variant="outlined"
                                            onChange={(e) => handleInjectionsChange(e, i)}
                                            style={{ marginBottom: i == availableModules[modalState.moduleIndex].module.textInjections.length - 1 ? "0" : "0.5rem" }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <Button variant="contained" style={{ backgroundColor: "#9b3032" }} onClick={closeModal}>Cancel</Button>
                        <Button variant="contained" style={{ backgroundColor: "#1f9e2c" }} onClick={confirmModal}>Confirm</Button>
                    </React.Fragment>
                }
            </Dialog>
            <Dialog
                open={loadedModalState.open}
                onClose={closeLoadedModal}
            >
                {(loadedModalState.open && info) &&
                    <React.Fragment>
                        <DialogTitle>Module Information</DialogTitle>
                        <div style={{ padding: "1rem" }}>
                            <Typography color="textPrimary"><b>Name:</b> {info.loadedModules[loadedModalState.moduleIndex].module.name}</Typography>
                            <Typography color="textPrimary"><b>Version:</b> {info.loadedModules[loadedModalState.moduleIndex].version}</Typography>
                            <Typography color="textPrimary"><b>Description:</b> {info.loadedModules[loadedModalState.moduleIndex].module.description}</Typography>
                            <Typography color="textPrimary"><b>UUID:</b> {info.loadedModules[loadedModalState.moduleIndex].module.uuid}</Typography>
                            <Typography color="textPrimary"><b>Path:</b> {info.loadedModules[loadedModalState.moduleIndex].module.path}</Typography>
                        </div>
                        <Button variant="contained" style={{ backgroundColor: "#9b3032" }} onClick={() => setConfirmModalOpen(true)}>Remove</Button>
                        <Button variant="contained" onClick={closeLoadedModal}>Close</Button>
                    </React.Fragment>
                }
            </Dialog>
            <Dialog
                open={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
            >
                {confirmModalOpen &&
                    <React.Fragment>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <div style={{ padding: "1rem" }}>
                            <Typography color="textPrimary">{`This action cannot be undone. Make sure to remove any associated database tables & functions.`}</Typography>
                        </div>
                        <Button variant="contained" style={{ backgroundColor: "#9b3032" }} onClick={removeModule}>Delete</Button>
                        <Button variant="contained" onClick={() => setConfirmModalOpen(false)}>Close</Button>
                    </React.Fragment>
                }
            </Dialog>
        </div>
    );
}