import { Button, Paper, TextField, Typography, Select, MenuItem } from '@material-ui/core';
import React from 'react';
import * as api from '../definitions/api';
import * as types from '../definitions/types';
import * as theme from '../theme';

//@ts-ignore
import * as FT from 'react-folder-tree';

interface Props {
    buttonText?: string;
    onFolderSelected?: (path: string) => void;
    shouldRefresh?: boolean;
    resetRefresh?: () => void;
}

export const FolderTree = (props: Props) => {
    const [fileList, setFileList] = React.useState<types.FileNode>({ name: "", children: [] });
    const [loadedDirectory, setLoadedDirectory] = React.useState("");

    const pickFolder = () => {
        api.openFolderDialog(loadedDirectory).then((data) => {
            if (data.length == 0) return;
            localStorage.setItem("saved_project_path", data[0]);
            if (typeof props.onFolderSelected == "function")
                props.onFolderSelected(data[0]);
            api.enumerateDirectory(data[0]).then((list) => {             
                setFileList({ name: data[0], children: list });
                setLoadedDirectory(data[0]);
            });
        });
    }

    React.useEffect(() => {
        if (props.shouldRefresh && loadedDirectory != "") {
            api.enumerateDirectory(loadedDirectory).then((list) => {             
                setFileList({ name: loadedDirectory, children: list });
            });
            if (typeof props.resetRefresh == "function")
                props.resetRefresh();
        }
    });

    React.useEffect(() => {
        const savedProjectPath = localStorage.getItem("saved_project_path");
        if (savedProjectPath) {
            if (typeof props.onFolderSelected == "function")
                props.onFolderSelected(savedProjectPath);
            api.enumerateDirectory(savedProjectPath).then((list) => {             
                setFileList({ name: savedProjectPath, children: list });
                setLoadedDirectory(savedProjectPath);
            });
        }
    }, []);

    return (
        <div>
            <Button variant="contained" style={{ marginBottom: "1rem" }} onClick={pickFolder}>{props.buttonText ?? "Pick Folder"}</Button>
            {fileList.children.length > 0 &&
                <div style={{ color: theme.PALETTE_WHITE }}>
                    <FT.default data={fileList} initOpenStatus="closed" onChange={() => {}} showCheckbox={false} readOnly />
                </div>
            }
        </div>
    );
}