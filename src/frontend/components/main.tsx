import { Button, Paper, TextField, Typography, Select, MenuItem } from '@material-ui/core';
import React from 'react';
import * as api from '../definitions/api';
import * as types from '../definitions/types';
import * as theme from '../theme';
import { FolderTree } from './folderTree';
import { ModuleList } from './moduleList';

import '../css/global.css'
import 'react-folder-tree/dist/style.css';

declare var window: types.Window;

export const Main = () => {
    const [selectedProject, setSelectedProject] = React.useState("");

    return (
        <div style={{ display: 'flex', gap: "5rem" }}>
            <FolderTree
                buttonText="Select Project"
                onFolderSelected={setSelectedProject}
            />
            <ModuleList
                projectPath={selectedProject}
            />
        </div>
    );
}