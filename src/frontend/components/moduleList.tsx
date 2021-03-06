import { Checkbox, DialogTitle, FormControl, InputLabel } from '@material-ui/core';
import { Button, Paper, TextField, Typography, Select, MenuItem, Modal, Dialog } from '@material-ui/core';
import React from 'react';
import * as api from '../definitions/api';
import * as types from '../definitions/types';
import * as theme from '../theme';
import { PostInstallDialog } from './postInstallDialog';

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
    const [processing, setProcessing] = React.useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
    const [postInstallDialogOpen, setPostInstallDialogOpen] = React.useState(false);
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

    const closeModal = () => {
        setModalState({...modalState, open: false});
        setInjections([]);
    }

    const confirmModal = () => {
        applyModule(modalState.moduleIndex);
    }

    const applyModule = (index: number) => {
        if (props.projectPath == "") return;
        setProcessing(true);
        api.applyModule(props.projectPath, availableModules[index].module, injections).then(result => {
            setInjections([]);
            console.log(result);
            refreshData();
            setPostInstallDialogOpen(true);
            setProcessing(false);
            closeModal();
        });
    }

    const removeModule = () => {
        if (props.projectPath == "" || !info) return;
        closeLoadedModal();
        setProcessing(true);
        api.removeModule(props.projectPath, info.loadedModules[loadedModalState.moduleIndex].module).then(result => {
            console.log(result);
            refreshData();
            setProcessing(false);
            setConfirmModalOpen(false);
        });
    }

    React.useEffect(loadInfoFile, [props.projectPath]);
    React.useEffect(() => {
        const savedModulePath = localStorage.getItem("saved_module_path");
        if (savedModulePath) {
            setModulesPath(savedModulePath);
            loadAvailableModules(savedModulePath);
        }
    }, []);

    const handleInjectionsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, i: number) => {
        let newArr = injections;
        injections[i] = e.target.value;
        setInjections(newArr);
    }

    const closeLoadedModal = () => {
        setLoadedModalState({...loadedModalState, open: false });
    }

    const refreshData = () => {
        loadInfoFile();
        loadAvailableModules(modulesPath);
        props.refreshTree();
    }

    const mapAvailableModules = () => {
        if (!info) return [];
        let available: JSX.Element[] = [];
        availableModules.map((e, i) => {
            if (info.loadedModules.findIndex(m => m.module.uuid == e.module.uuid) == -1) {
                available.push(<Button style={{ marginBottom: "0.25rem" }} key={`abtn${i}`} onClick={() => tryApplyModule(i)} variant="contained">{e.module.name}</Button>);
                available.push(<br key={`abr${i}`} />);
            }
        });
        available.pop();
        return available;
    }

    const mapAvailableUpgrades = () => {
        if (!info) return [];
        let available: JSX.Element[] = [];
        availableModules.map((e, i) => {
            if (info.loadedModules.findIndex(m => m.module.uuid == e.module.uuid && m.version < e.version) != -1) {
                available.push(<Button style={{ marginBottom: "0.25rem" }} key={`bbtn${i}`} onClick={() => tryApplyModule(i)} variant="contained">{e.module.name}</Button>);
                available.push(<br key={`bbr${i}`} />);
            }
        });
        available.pop();
        return available;
    }

    const updateModulePath = () => {
        api.openFolderDialog(modulesPath).then((data) => {
            if (data.length == 0) return;
            setModulesPath(data[0]);
            localStorage.setItem("saved_module_path", data[0]);
            loadAvailableModules(data[0]);
        });
    }

    const updateDbType = (type: string) => {
        if (!info) return;

        api.updateDbType(props.projectPath, type).then(() => setInfo({ ...info, dbType: type }));
    }

    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem", gap: "0.5rem" }}>
                <TextField
                    fullWidth
                    label="Modules folder location"
                    variant="outlined"
                    value={modulesPath}
                    disabled
                />
                <Button variant="outlined" onClick={updateModulePath}>Change</Button>
            </div>
            {(info && props.projectPath != "") &&
                <FormControl fullWidth variant="outlined">
                    <InputLabel id="db-select-label">Loaded project database type</InputLabel>
                    <Select
                        style={{ marginBottom: "1rem" }}
                        labelId="db-select-label"
                        label="Loaded project database type"
                        value={info.dbType}
                        onChange={(e) => updateDbType(e.target.value as string)}
                    >
                        <MenuItem value={"none"}>None</MenuItem>
                        <MenuItem value={"sqlserver"}>SQLServer</MenuItem>
                        <MenuItem value={"mysql"}>MySQL</MenuItem>
                    </Select>
                </FormControl>
            }
            {props.projectPath != "" && <Button variant="contained" fullWidth onClick={refreshData} style={{ marginBottom: "1rem" }}>Refresh</Button>}
            {info &&
                <div style={{ display: "flex", gap: "1rem" }}>
                    <div>
                        <Typography color="textPrimary">Loaded Modules</Typography>
                        <hr />
                        {info.loadedModules.length > 0 ?
                            info.loadedModules.map((e, i) => {
                                return (
                                    <React.Fragment key={`cbtn${i}`}>
                                        <Button style={{ marginBottom: "0.25rem" }} onClick={() => setLoadedModalState({ open: true, moduleIndex: i })} variant="contained">{e.module.name}</Button>
                                        {i != info.loadedModules.length - 1 && <br />}
                                    </React.Fragment>
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
                onClose={() => {if (!processing) closeModal();}}
            >
                {modalState.open &&
                    <React.Fragment>
                        <DialogTitle>Setup Module</DialogTitle>
                        <div style={{ padding: "1rem" }}>
                            <Typography><b>Version:</b> {availableModules[modalState.moduleIndex].version}</Typography>
                            <Typography><b>Description:</b> {availableModules[modalState.moduleIndex].module.description}</Typography>
                            <Typography><b>SQL Support:</b> {availableModules[modalState.moduleIndex].module.sqlSupport.join(", ")}</Typography>
                            <Typography><b>Requirements</b></Typography>
                            {availableModules[modalState.moduleIndex].module.requirements.map((r, i) => {
                                return (
                                    <div key={i} style={{ display: "flex", alignItems: "center" }}>
                                        <ContainedCheckbox />
                                        <Typography>- {r}</Typography>
                                    </div>
                                );
                            })}
                            <br />
                            {availableModules[modalState.moduleIndex].module.textInjections.length > 0 && <Typography><b>Additional Setup</b></Typography>}
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
                        <Button variant="contained" style={{ backgroundColor: "#9b3032" }} disabled={processing} onClick={closeModal}>Cancel</Button>
                        <Button variant="contained" style={{ backgroundColor: "#1f9e2c" }} disabled={processing} onClick={confirmModal}>Confirm</Button>
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
                            <Typography color="textPrimary"><b>SQL Support:</b> {info.loadedModules[loadedModalState.moduleIndex].module.sqlSupport.join(", ")}</Typography>
                            <Typography color="textPrimary"><b>UUID:</b> {info.loadedModules[loadedModalState.moduleIndex].module.uuid}</Typography>
                            <Typography color="textPrimary"><b>Path:</b> {info.loadedModules[loadedModalState.moduleIndex].module.path}</Typography>
                            <br />
                            <Typography><b>Requirements</b></Typography>
                            {info.loadedModules[loadedModalState.moduleIndex].module.requirements.map((r, i) => {
                                return (
                                    <div key={i}>
                                        <Typography>- {r}</Typography>
                                    </div>
                                );
                            })}
                        </div>
                        <Button variant="contained" style={{ backgroundColor: "#9b3032" }} onClick={() => setConfirmModalOpen(true)}>Remove</Button>
                        <Button variant="contained" onClick={closeLoadedModal}>Close</Button>
                    </React.Fragment>
                }
            </Dialog>
            <Dialog
                open={confirmModalOpen}
                onClose={() => { if (!processing) setConfirmModalOpen(false); }}
            >
                {confirmModalOpen &&
                    <React.Fragment>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <div style={{ padding: "1rem" }}>
                            <Typography color="textPrimary">{`This action cannot be undone. Make sure to remove any associated database tables & functions.`}</Typography>
                        </div>
                        <Button variant="contained" disabled={processing} style={{ backgroundColor: "#9b3032" }} onClick={removeModule}>Delete</Button>
                        <Button variant="contained" disabled={processing} onClick={() => setConfirmModalOpen(false)}>Close</Button>
                    </React.Fragment>
                }
            </Dialog>
            <PostInstallDialog
                open={postInstallDialogOpen}
                onClose={() => setPostInstallDialogOpen(false)}
                projectPath={props.projectPath}
            />
        </div>
    );
}