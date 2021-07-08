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
}

export const FolderTree = (props: Props) => {
    const [fileList, setFileList] = React.useState<types.FileNode>({ name: "", children: [] });

    const pickFolder = () => {
        api.openFolderDialog().then((data) => {
            if (data.length == 0) return;
            if (typeof props.onFolderSelected == "function")
                props.onFolderSelected(data[0]);
            api.enumerateDirectory(data[0]).then((list) => {             
                setFileList({ name: data[0], children: list });
            });
        });
    }

    return (
        <div>
            <Button variant="contained" onClick={pickFolder}>{props.buttonText ?? "Pick Folder"}</Button>
            {fileList.children.length > 0 &&
                <div style={{ color: theme.PALETTE_WHITE }}>
                    <FT.default data={fileList} initOpenStatus="closed" onChange={() => {}} showCheckbox={false} readOnly />
                </div>
            }
        </div>
    );
}