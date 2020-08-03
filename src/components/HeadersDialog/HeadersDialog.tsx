import { Button, Checkbox, createStyles, DialogActions, Grid, IconButton, makeStyles, Tooltip } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import DeleteIcon from '@material-ui/icons/Delete';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { Headers } from 'http-headers-js';
import { filter, isEmpty, last } from 'ramda';
import React, { ChangeEvent, FC, Fragment, useEffect, useRef, useState } from 'react';
import { HeaderConfig, HeadersConfigDb } from '../../types';

const useStyles = makeStyles(() =>
  createStyles({
    row: {
      display: 'flex',
      alignItems: 'flex-end',
    },
  })
);

type Props = {
  open?: boolean;
  data?: HeadersConfigDb;

  onCancel?: () => void;
  onOk?: (data: HeadersConfigDb) => void;
};

const HeadersDialog: FC<Props> = ({ data: dataProp = [], open = false, onCancel, onOk }) => {
  const classes = useStyles();
  const [data, setData] = useState<HeaderConfig[]>(dataProp);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;

    setData(dataProp);
    setTimeout(() => nameRef.current?.focus(), 2);
  }, [dataProp, open]);

  useEffect(() => {
    const newItem: HeaderConfig = { enabled: true, name: '', value: '' };

    if (isEmpty(data)) {
      setData([newItem]);
      return;
    }

    const lastItem = last(data);

    if (lastItem?.name) {
      setData([...data, newItem]);
    }
  }, [data]);

  const handleEnabledChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;

    setData((prev) => {
      const newData = { ...prev[index], enabled: checked };

      return [...prev.slice(0, index), newData, ...prev.slice(index + 1)];
    });
  };

  const handleNameSelection = (index: number) => (e: ChangeEvent<{}>, value: string | null) => {
    setData((prev) => {
      const newData = { ...prev[index], name: value || '' };

      return [...prev.slice(0, index), newData, ...prev.slice(index + 1)];
    });
  };

  const handleNameInputChange = (index: number) => (e: ChangeEvent<{}>, value: string) => {
    setData((prev) => {
      const newData = { ...prev[index], name: value };

      return [...prev.slice(0, index), newData, ...prev.slice(index + 1)];
    });
  };

  const handleValueChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    setData((prev) => {
      const newData = { ...prev[index], value };

      return [...prev.slice(0, index), newData, ...prev.slice(index + 1)];
    });
  };

  const handleDelete = (index: number) => () => {
    setData((prev) => [...prev.slice(0, index), ...prev.slice(index + 1)]);
  };

  const handleOk = () => onOk && onOk(filter((f) => !!f.name, data));

  return (
    <div>
      <Dialog open={open} fullWidth maxWidth="md" onClose={onCancel} aria-labelledby="form-dialog-title">
        <DialogTitle id="add-dialog-title">Headers</DialogTitle>
        <DialogContent>
          <Grid container spacing={1}>
            {data.map((m, index) => (
              <Fragment key={index}>
                <Grid className={classes.row} item xs={6}>
                  <Checkbox id={`enabled-${index}`} checked={m.enabled} onChange={handleEnabledChange(index)} />

                  <Autocomplete
                    id={`name-${index}`}
                    options={Object.values(Headers) as string[]}
                    fullWidth
                    freeSolo
                    inputValue={m.name}
                    onChange={handleNameSelection(index)}
                    onInputChange={handleNameInputChange(index)}
                    renderInput={(params) => <TextField {...params} inputRef={nameRef} margin="dense" label="Name" autoComplete="off" />}
                  />
                </Grid>
                <Grid className={classes.row} item xs={6}>
                  <TextField margin="dense" id={`value-${index}`} label="Value" fullWidth value={m.value} onChange={handleValueChange(index)} />

                  <Tooltip title="Delete">
                    <IconButton aria-label="delete" onClick={handleDelete(index)}>
                      <DeleteIcon color="action" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Fragment>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={handleOk} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default HeadersDialog;
