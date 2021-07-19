# WAMM Module Specification V1.0

## Folder Structure
- module-name
    - waminfo.json
    - 1
    - 2 
        - File1.cs
        - File2.ts
        - package.json
        - upgrade-sqlserver.sql
        - upgrade-mysql.sql

## Additional Information
- Each version of the module is distinguished by ascending numbered folders
- Each version folder contains all files in their most updated state excluding any .sql files, which should build off of the sql files from the previous versions in a sequential fashion (as they are all applied to the database in order)
- .sql files are not required in every version; they are only required in the versions that need changes
- The package.json is not required unless the module contains any frontend elements (example package.json provided below)
- The mysql/sqlserver upgrades should be identical, but the inclusion of either one indicates support for that database architecture, and neither are required
- No specific type of file is required

## waminfo.json
```json
{
    "name": "module-name",
    "description": "Module description",
    "requirements": [
        "Requirement 1",
        "Requirement 2"
    ],
    "sqlSupport": [
        "mysql"
    ],
    "uuid": "6ea3602e-3329-4977-ae4f-1bf3728c5019",
    "textInjections": [
        {
            "replacementString": "replacement",
            "requestText": "Information to replace text with",
            "files": [
                "File1.cs"
            ]
        }
    ]
}
```
### Fields:
- **name**: the name of the module
- **description**: the description of the module
- **requirements**: any additional dependencies required by the module which will be displayed to the user upon installation
- **sqlSupport**: the versions of sql this module supports. can currently include "sqlserver", "mysql", or nothing if no db is required
- **uuid**: the unique identifier for this module ([generator](https://www.uuidgenerator.net/))
- **textInjections**: users will be prompted to fill out the requested information upon installation, which will be injected into specified files in the form of text replacement
    - **replacementString**: the string pattern to find and replace with the user input (ex the string "replacement" will be turned into "~{replacement}~", and that is what will be searched for in the file)
    - **requestText**: the client-facing description of this information request
    - **files**: the names of all files affected by this search and replace

## package.json
```json
{
    "name": "module-name",
    "version": "1.0.0",
    "files": [
        "File1.tsx",
        "File2.ts"
    ],
    "module": "File1.tsx",
    "dependencies": {
        "js-cookie": "2.2.1"
    }
}
```

## Including the Files
- If the module does not provide a webpack module for the frontend, then the files must be included in this way:
```ts
import { Component } from "module-name/File1";
```
- For c#, a namespace should be specified related to the name of the project for easy inclusion
- For any sql tables or functions, they should be in their own schema 