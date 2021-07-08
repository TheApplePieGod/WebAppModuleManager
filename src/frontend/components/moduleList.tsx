import { Checkbox, DialogTitle } from '@material-ui/core';
import { Button, Paper, TextField, Typography, Select, MenuItem, Modal, Dialog } from '@material-ui/core';
import React from 'react';
import * as api from '../definitions/api';
import * as types from '../definitions/types';
import * as theme from '../theme';

interface Props {
    projectPath: string;
}

const ContainedCheckbox = () => {
    const [checked, setChecked ] = React.useState(false);
    return <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} style={{ marginTop: "auto", marginBottom: "auto" }} />
}

export const ModuleList = (props: Props) => {
    const [info, setInfo] = React.useState<types.ProjectInfo | undefined>(undefined);
    const [availableModules, setAvailableModules] = React.useState<types.Module[]>([]);
    const [injections, setInjections] = React.useState<string[]>([]);
    const [modalState, setModalState] = React.useState({
        open: false,
        moduleIndex: 0,
    });

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
        setInjections(new Array(availableModules[index].textInjections.length));
        setModalState({
            open: true,
            moduleIndex: index,
        });
    }

    const applyModule = (index: number) => {
        if (props.projectPath == "") return;
        api.applyModule(props.projectPath, availableModules[index], injections).then(result => {
            console.log(result);
            setInjections([]);
        });
    }

    React.useEffect(loadInfoFile, [props.projectPath]);
    React.useEffect(() => loadAvailableModules("D:/Projects/WebAppModuleManager/modules"), []);

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

    return (
        <div>
            {info &&
                <div style={{ display: "flex", gap: "1rem" }}>
                    <div>
                        <Typography color="textPrimary">Loaded Modules</Typography>
                        <hr />
                        {info.loadedModules.length > 0 ?
                            <></>
                            : <Typography color="textPrimary">None</Typography>
                        }
                    </div>
                    <div>
                        <Typography color="textPrimary">Available Modules</Typography>
                        <hr />
                        {availableModules.length > 0 ?
                            availableModules.map((e, i) => {
                                return (
                                    <Button key={i}onClick={() => tryApplyModule(i)} variant="contained">{e.name}</Button>
                                );
                            })
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
                            <Typography><b>Requirements</b></Typography>
                            {availableModules[modalState.moduleIndex].requirements.map((r, i) => {
                                return (
                                    <div key={i} style={{ display: "flex" }}>
                                        <ContainedCheckbox />
                                        <p dangerouslySetInnerHTML={{__html: `${r.replaceAll("\n", "<br />")}`}} />
                                    </div>
                                );
                            })}
                            <br />
                            <Typography><b>Additional Setup</b></Typography>
                            {availableModules[modalState.moduleIndex].textInjections.map((e, i) => {
                                return (
                                    <div key={i}>
                                        <Typography>{e.requestText}</Typography>
                                        <TextField
                                            fullWidth
                                            value={injections[i]}
                                            variant="outlined"
                                            onChange={(e) => handleInjectionsChange(e, i)}
                                            style={{ marginBottom: i == availableModules[modalState.moduleIndex].textInjections.length - 1 ? "0" : "0.5rem" }}
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
        </div>
    );
}