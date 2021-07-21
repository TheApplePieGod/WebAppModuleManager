import { Button, Dialog, DialogTitle, Typography } from '@material-ui/core';
import React from 'react';
import * as api from '../definitions/api';
import * as types from '../definitions/types';
import * as theme from '../theme';
const { ipcRenderer } = require("electron");

interface Props {
    open: boolean;
    onClose: () => void;
    projectPath: string;
}

let recievedData: string[] = [];

export const PostInstallDialog = (props: Props) => {
    const [outputText, setOutputText] = React.useState("");
    const [running, setRunning] = React.useState(false);
    const [complete, setComplete] = React.useState(false);

    const onDataRecieved = (event: any, data: string) => {
        recievedData.push(data);
        setOutputText(recievedData.join(""));
    }

    const onCommandComplete = (event: any, code: string) => {
        setComplete(true);
    }

    const parseOutputText = () => {
        let elems: JSX.Element[] = [];
        const split = outputText.split('\n');
        for (let i = 0; i < split.length; i++) {
            elems.push(<p key={i}>{split[i]}</p>);
        }
        return elems;
    }

    React.useEffect(() => {
        ipcRenderer.on('recieveCommandOutput', onDataRecieved);
        ipcRenderer.on('commandComplete', onCommandComplete);
        return (() => {
            ipcRenderer.off('recieveCommandOutput', onDataRecieved);
            ipcRenderer.off('commandComplete', onCommandComplete);
        });
    }, []);

    const runInstall = () => {
        api.runNpmInstall("D:\\Projects\\Dreamshare");
        setRunning(true);
    }

    const onClose = () => {
        if (running && !complete) return;

        props.onClose();
        setRunning(false);
        setComplete(false);
        setOutputText("");
        recievedData = [];
    }

    return (
        <Dialog
            open={props.open}
            onClose={onClose}
            fullWidth
        >
            {props.open &&
                <React.Fragment>
                    <DialogTitle>Post Install</DialogTitle>
                    <div style={{ padding: "1rem" }}>
                        {running ?
                            <Typography style={{ color: complete ? "#1f9e2c" : "inherit" }}>{complete ? "Done!" : "Running... (closing will not stop the task)"}</Typography>
                            : <Typography>Installation complete. Would you like to run <b>npm install</b> now?</Typography>
                        }
                    </div>
                    {running ?
                        <div style={{ fontFamily: "Source Code Pro", overflowY: "scroll", maxHeight: "50vh", margin: "1rem", padding: "1rem", backgroundColor: "#000" }}>
                            {parseOutputText()}
                        </div>
                        : <Button variant="contained" style={{ backgroundColor: "#1f9e2c" }} onClick={runInstall}>Run</Button>
                    }
                    <Button variant="contained" disabled={running && !complete} onClick={onClose}>Close</Button>
                </React.Fragment>
            }
        </Dialog>
    );
}