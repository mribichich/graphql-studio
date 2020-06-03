import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import { any, not } from 'ramda';
import React, { ChangeEvent, FC, useEffect, useState } from 'react';
import { LOCAL_STORAGE_PREFIX } from './constants';

export type Form = { domain: string; client_id: string; audience: string };

type Props = {
    open?: boolean;

    onClose?: () => void;
    onCancel?: () => void;
    onOk?: (data: Form) => void;
};

const AuthConfigDialog: FC<Props> = ({ open = false, onClose, onCancel, onOk }) => {
    const [data, setData] = useState<Form>({ domain: '', client_id: '', audience: '' });

    useEffect(() => {
        if (!open) return;

        const data = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}authConfig`);

        if (!data) return;

        setData(JSON.parse(data)['dev']);
    }, [open]);

    const handleDomainChange = (e: ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, domain: e.target.value });
    };

    const handleClientIdChange = (e: ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, client_id: e.target.value });
    };

    const handleAudienceChange = (e: ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, audience: e.target.value });
    };

    const handleOk = () => {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}authConfig`, JSON.stringify({ dev: data }));

        onOk && onOk(data);
    };

    const invalid = any((a) => not(a), Object.values(data));

    return (
        <div>
            <Dialog open={open} onClose={onClose} aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Subscribe</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="domain"
                        label="Domain"
                        fullWidth
                        value={data.domain}
                        onChange={handleDomainChange}
                        error={!data.domain}
                    />
                    <TextField
                        margin="dense"
                        id="client_id"
                        label="Client Id"
                        fullWidth
                        value={data.client_id}
                        onChange={handleClientIdChange}
                        error={!data.client_id}
                    />
                    <TextField
                        margin="dense"
                        id="audience"
                        label="Audience"
                        fullWidth
                        value={data.audience}
                        onChange={handleAudienceChange}
                        error={!data.audience}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleOk} color="primary" disabled={invalid}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AuthConfigDialog;
