import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import RefreshIcon from '@material-ui/icons/Refresh';
import clsx from 'clsx';
import React, { ChangeEvent, FC } from 'react';

const useStyles = makeStyles(() =>
    createStyles({
        root: {
            alignItems: 'center',
            display: 'flex',
        },
    })
);

type Props = {
    className?: string;
    url?: string;

    onRefreshClick?: () => void;
    onUrlChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

const Toolbar: FC<Props> = ({ className, url, onRefreshClick, onUrlChange }) => {
    const classes = useStyles();

    return (
        <div className={clsx(className, classes.root)}>
            <InputLabel shrink htmlFor="url">
                URL
            </InputLabel>
            <TextField
                id="url"
                variant="outlined"
                size="small"
                value={url}
                fullWidth
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton aria-label="refresh" onClick={onRefreshClick}>
                                <RefreshIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                onChange={onUrlChange}
            />
        </div>
    );
};

export default Toolbar;
