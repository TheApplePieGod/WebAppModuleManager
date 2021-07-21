import { Button, Paper, TextField, Typography, Select, MenuItem, Dialog, DialogTitle } from '@material-ui/core';
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
    const [refreshTree, setRefreshTree] = React.useState(false);
    const [infoOpen, setInfoOpen] = React.useState(false);

    return (
        <div style={{ display: 'flex', gap: "5rem" }}>
            <div style={{ maxWidth: "30%", width: "30%" }}>
                <Button variant="contained" style={{ marginBottom: "0.5rem" }} onClick={() => setInfoOpen(true)}>Setup Info</Button>
                <FolderTree
                    buttonText="Select Project"
                    onFolderSelected={setSelectedProject}
                    shouldRefresh={refreshTree}
                    resetRefresh={() => setRefreshTree(false)}
                />
            </div>
            <ModuleList
                projectPath={selectedProject}
                refreshTree={() => setRefreshTree(true)}
            />
            <Dialog
                open={infoOpen}
                onClose={() => setInfoOpen(false)}
            >
                {infoOpen &&
                    <React.Fragment>
                        <DialogTitle>Welcome to WAMM</DialogTitle>
                        <div style={{ padding: "1rem" }}>
                            <Typography color="textPrimary"><b>Some setup requirements</b></Typography>
                            <Typography color="textPrimary">- The project must be a DotNet Core application</Typography>
                            <Typography color="textPrimary">- It is recommended to use dbup or some other database migration framework</Typography>
                            <Typography color="textPrimary">- Include these ItemGroups in your .csproj file ({`
                            <ItemGroup>
                                <EmbeddedResource Remove="WAMM\**" />
                                <None Remove="WAMM\**" />
                                <Content Remove="WAMM\**" />
                                <Compile Remove="WAMM\**" />
                                <TypeScriptCompile Remove="WAMM\**" />
                            </ItemGroup>
                        
                            <ItemGroup>
                                <EmbeddedResource Include="WAMM\Migrations\*.sql" />
                                <Compile Include="WAMM\**\*.cs" />
                            </ItemGroup>
                            `
                            })</Typography>
                            <Typography color="textPrimary">- You may have to specify the WAMM folder generated in your project's directory in your webpack config</Typography>
                            <Typography color="textPrimary">- Visual Studio might lag when installing/removing big modules, so it might be best to close it</Typography>
                        </div>
                        <Button variant="contained" onClick={() => setInfoOpen(false)}>Close</Button>
                    </React.Fragment>
                }
            </Dialog>
        </div>
    );
}