import Dialog from '@material-ui/core/Dialog';
import { reduce, without } from 'ramda';
import React, { FC, useState } from 'react';
import AuthConfigForm from './components/AuthConfigForm';
import { Form } from './components/AuthConfigForm/AuthConfigForm';
import AuthConfigList from './components/AuthConfigList';
import { LOCAL_STORAGE_PREFIX } from './constants';
import { AuthConfigDb } from './types';

type Props = {
    open?: boolean;
    data?: AuthConfigDb;

    onChange?: (data: AuthConfigDb) => void;
    onClose?: () => void;
    onOk?: () => void;
};

const AuthConfigDialog: FC<Props> = ({ data = {}, open = false, onChange, onClose, onOk }) => {
    // const [data, setData] = useState<AuthConfigDb>({});
    const [formVisible, setFormVisible] = useState(false);

    // useEffect(() => {
    //     if (!open) return;

    //     const data = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}authConfig`);

    //     if (!data) return;

    //     setData(JSON.parse(data));
    // }, [open]);

    const handleAdd = () => {
        setFormVisible(true);
    };

    const handleCancel = () => {
        setFormVisible(false);
    };

    const handleSaved = (newConfig: Form) => {
        const newData = { ...data, [newConfig.name]: newConfig };

        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}authConfig`, JSON.stringify(newData));

        onChange && onChange(newData);
        setFormVisible(false);
    };

    const handleOk = () => {
        onOk && onOk();
    };

    const handleDelete = (name: string) => {
        const newData = reduce<string, AuthConfigDb>((acc, cur) => ({ ...acc, [cur]: data[cur] }), {}, without([name], Object.keys(data)));

        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}authConfig`, JSON.stringify(newData));

        onChange && onChange(newData);
    };

    return (
        <div>
            <Dialog open={open} fullWidth maxWidth="sm" onClose={onClose} aria-labelledby="form-dialog-title">
                {formVisible ? (
                    <AuthConfigForm onCancel={handleCancel} onSaved={handleSaved} />
                ) : (
                    <AuthConfigList data={data} onAdd={handleAdd} onOk={handleOk} onDelete={handleDelete} />
                )}
            </Dialog>
        </div>
    );
};

export default AuthConfigDialog;
