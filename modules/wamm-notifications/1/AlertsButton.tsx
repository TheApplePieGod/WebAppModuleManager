import { Badge, Divider, IconButton, Menu, MenuItem, Typography } from "@material-ui/core";
import * as React from "react";
import NotificationsIcon from '@material-ui/icons/Notifications';
import { Alert } from "./Alert";
import Moment from 'react-moment';
import CloseIcon from '@material-ui/icons/Close';
//import { PALETTE_LIGHT_GREY } from "../../Styles/Constants";
import * as Cookies from "js-cookie";
import { Skeleton } from "@material-ui/lab";

interface Props {
    currentUserId: number;
}

const _AlertsButton = (props: Props) => {
    let interval: any = 0;

    const [open, setOpen] = React.useState<null | HTMLElement>(null);
    const [alerts, setAlerts] = React.useState<Alert[]>([]);
    const [notifNum, setNotifNum] = React.useState(0);

    const refreshAlertCount = () => {
        if (props.currentUserId != 0) {
            const url = `api/getAlertsCount`;
            fetch(url, {
                method: 'GET',
                credentials: 'same-origin'
            })
                .then(result => {
                    if (result.ok)
                        result.json().then((data: number) => {
                            setNotifNum(data);
                        });
                    else {
                        console.log("Error loading notifications information");
                        //dispatch(openSnackbar(SnackbarStatus.Error, "Error loading notifications information", 3000));
                    }
                })
        }
    }

    React.useEffect(() => {
        refreshAlertCount();
        clearInterval(interval);
        interval = setInterval(refreshAlertCount, 10000);
        return (() => {
            clearInterval(interval);
        });
    }, [props]);

    const handleClose = () => {
        setOpen(null);
    }

    const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!open) {
            setOpen(event.currentTarget);
            setAlerts([]);
            if (props.currentUserId != 0) {
                const url = `api/getAlerts`;
                fetch(url, {
                    method: 'GET',
                    credentials: 'same-origin'
                })
                    .then(result => {
                        if (result.ok)
                            result.json().then((data: Alert[]) => {
                                setAlerts(data);
                                setNotifNum(0);
                            });
                        else {
                            console.log("Error loading notifications");
                            //dispatch(openSnackbar(SnackbarStatus.Error, "Error loading notifications", 3000));
                        }
                    })
            }
        }
    }

    const handleClick = (clickAction: number, clickInfo: string) => {
        //if (clickAction == 1) { // send to challenge
        //    history.push('/challenges/view/' + clickInfo);
        //} else if (clickAction == 2) { // send to writeup
        //    history.push('/challenges/writeups/view/' + clickInfo);
        //}
    }

    const handleClear = (alertId: number) => {
        const url = "api/clearAlert";
        fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': Cookies.get("XSRF-TOKEN") || ""
            },
            body: JSON.stringify(alertId),
            credentials: 'same-origin'
        })
            .then(result => {
                if (!result.ok) {
                    console.log("Clear alert failed");
                    //result.text().then((text) => dispatch(openSnackbar(SnackbarStatus.Error, "Failed to clear alert", 5000)));
                } else {
                    let newAlerts: Alert[] = []
                    for (let i = 0; i < alerts.length; i++) {
                        if (alerts[i].id != alertId)
                            newAlerts.push(alerts[i]);
                    }
                    setAlerts(newAlerts);
                }
            })
    }

    return (
        <React.Fragment>
            <Badge badgeContent={notifNum} invisible={notifNum == 0} color="error" overlap="circle">
                <IconButton onClick={handleOpen}><NotificationsIcon /></IconButton>
            </Badge>
            <Menu
                id="alerts-menu"
                anchorEl={open}
                style={{ maxWidth: "30vw", minWidth: 225 }}
                keepMounted
                open={Boolean(open)}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center"
                }}
                getContentAnchorEl={null}
            >
                {alerts.length == 0 ?
                    (notifNum != 0) ?
                        (
                            <div>
                                <MenuItem style={{ display: 'flex', flexDirection: 'column', alignItems: 'middle', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
                                    <Skeleton variant="rect" width={200} height={15} style={{ marginBottom: "0.5rem" }} />
                                    <Skeleton variant="rect" width={100} height={12} />
                                </MenuItem>
                                <Divider style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }} />
                                <MenuItem style={{ display: 'flex', flexDirection: 'column', alignItems: 'middle', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
                                    <Skeleton variant="rect" width={200} height={15} style={{ marginBottom: "0.5rem" }} />
                                    <Skeleton variant="rect" width={100} height={12} />
                                </MenuItem>
                                <Divider style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }} />
                                <MenuItem style={{ display: 'flex', flexDirection: 'column', alignItems: 'middle', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
                                    <Skeleton variant="rect" width={200} height={15} style={{ marginBottom: "0.5rem" }} />
                                    <Skeleton variant="rect" width={100} height={12} />
                                </MenuItem>
                            </div>
                        )
                        :
                        (
                            <MenuItem style={{ wordWrap: "break-word", whiteSpace: "normal" }}>
                                You have no notifications.
                            </MenuItem>
                        )
                    :
                    alerts.map((alert, index) =>
                        <div key={index}>
                            <MenuItem onClick={() => handleClick(alert.clickAction, alert.clickInfo)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'middle', wordWrap: "break-word", whiteSpace: "normal", width: "25vw", minWidth: 200, textAlign: "center" }}>
                                <Typography variant="body1">{alert.content}</Typography>
                                <Typography variant="caption" color="textSecondary"><Moment format="L LT" local utc>{alert.timestamp}</Moment></Typography>
                                <IconButton style={{ position: "absolute", bottom: 0, right: 0 }} size="small" onClick={(e) => { e.stopPropagation(); handleClear(alert.id) }}><CloseIcon /></IconButton>   
                            </MenuItem>
                            {(index != alerts.length - 1) &&
                                <Divider />
                            }
                        </div>
                    )
                }
            </Menu>
        </React.Fragment>
    );
}

export const AlertsButton = React.memo(_AlertsButton);