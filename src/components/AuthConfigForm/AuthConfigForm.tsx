import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import { any, not } from 'ramda';
import React, { ChangeEvent, FC, useState } from 'react';

export type Form = { name: string; domain: string; client_id: string; audience: string };

type Props = {
    onCancel?: () => void;
    onSaved?: (data: Form) => void;
};

const AuthConfigForm: FC<Props> = ({ onCancel, onSaved: onOk }) => {
    const [data, setData] = useState<Form>({ name: '', domain: '', client_id: '', audience: '' });

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, name: e.target.value });
    };

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
        onOk && onOk(data);
    };

    const invalid = any((a) => not(a), Object.values(data));

    return (
        <>
            <DialogTitle id="add-dialog-title">Create Config</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    id="name"
                    label="Name"
                    fullWidth
                    value={data.name}
                    onChange={handleNameChange}
                    error={!data.name}
                />
                <TextField
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
        </>
    );
};

export default AuthConfigForm;
