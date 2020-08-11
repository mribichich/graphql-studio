import { Tooltip } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import AddIcon from '@material-ui/icons/Add';
import ClearIcon from '@material-ui/icons/Clear';
import RefreshIcon from '@material-ui/icons/Refresh';
import Autocomplete from '@material-ui/lab/Autocomplete';
import clsx from 'clsx';
import React, { ChangeEvent, FC, useState } from 'react';

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      alignItems: 'center',
      display: 'flex',
    },
    flex: {
      flex: 1,
    },
    action: {
      padding: 8,
    },
    firstAction: {
      marginLeft: 8,
    },
  })
);

type Props = {
  className?: string;
  url?: string;
  urls?: string[];

  onAddUrlClick?: () => void;
  onRefreshClick?: () => void;
  onRemoveUrlClick?: (url: string) => void;
  onUrlChange?: (e: ChangeEvent<{}>) => void;
  onUrlSelected?: (event: any, newValue: string | null) => void;
};

const Toolbar: FC<Props> = ({ className, url, urls = [], onAddUrlClick, onRemoveUrlClick, onRefreshClick, onUrlChange, onUrlSelected }) => {
  const classes = useStyles();
  const [value, setValue] = useState<string | null>(url as string | null);

  const handleUrlSelected = (event: any, newValue: string | null) => {
    setValue(newValue);
    onUrlSelected && onUrlSelected(event, newValue);
  };

  const handleRemoveUrlClick = (url: string) => (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();

    onRemoveUrlClick && onRemoveUrlClick(url);
  };

  return (
    <div className={clsx(className, classes.root)}>
      <InputLabel shrink htmlFor="url">
        URL
      </InputLabel>

      <Autocomplete
        size="small"
        fullWidth
        freeSolo
        autoHighlight
        value={value}
        onChange={handleUrlSelected}
        inputValue={url}
        onInputChange={onUrlChange}
        options={urls}
        renderOption={(option) => (
          <React.Fragment>
            {option}

            <span className={classes.flex} />

            <Tooltip title="Remove URL">
              <IconButton size="small" edge="end" aria-label="remove" onClick={handleRemoveUrlClick(option)}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </React.Fragment>
        )}
        renderInput={(params) => <TextField {...params} variant="outlined" />}
      />

      <Tooltip title="Add URL">
        <IconButton className={clsx(classes.action, classes.firstAction)} aria-label="add" onClick={onAddUrlClick}>
          <AddIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Refresh">
        <IconButton className={classes.action} aria-label="refresh" onClick={onRefreshClick}>
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    </div>
  );
};

export default Toolbar;
