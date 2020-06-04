import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import { isEmpty } from 'ramda';
import React, { FC } from 'react';
import { AuthConfigDb } from '../../types';

const useStyles = makeStyles(() =>
    createStyles({
        title: {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
        },
        noData: {
            display: 'flex',
            justifyContent: 'center',
            marginTop: 24,
        },
    })
);

type Props = {
    data?: AuthConfigDb;
    open?: boolean;

    onAdd?: () => void;
    onOk?: () => void;
    onDelete?: (name: string) => void;
};

const AuthConfigList: FC<Props> = ({ data = {}, open = false, onAdd, onOk, onDelete }) => {
    const classes = useStyles();

    const handleDelete = (name: string) => () => onDelete && onDelete(name);

    return (
        <>
            <DialogTitle id="form-dialog-title">
                <div className={classes.title}>
                    Auth Configs
                    <Tooltip title="Add">
                        <IconButton aria-label="add" onClick={onAdd}>
                            <AddIcon color="action" />
                        </IconButton>
                    </Tooltip>
                </div>
            </DialogTitle>
            <DialogContent>
                <Table aria-label="auth configs table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>URL</TableCell>
                            <TableCell align="right" />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.entries(data).map(([name, value]) => (
                            <TableRow key={name}>
                                <TableCell component="th" scope="row">
                                    {name}
                                </TableCell>
                                <TableCell>{value.domain}</TableCell>
                                <TableCell align="right">
                                    <Tooltip title="Delete">
                                        <IconButton aria-label="delete" size="small" onClick={handleDelete(name)}>
                                            <DeleteIcon color="action" fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {isEmpty(data) && <div className={classes.noData}>No data</div>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onOk} color="primary">
                    Ok
                </Button>
            </DialogActions>
        </>
    );
};

export default AuthConfigList;
