import { Toggle, TextInput, Button, FileInputButton, EditableList } from '../';
import { state, setState } from '../../../store';
import './index.scss';

const ControlledList = () => {
  const localState = {
    addInputText: '',
    clearButtonWarn: false,
  };

  const makeAddHandler = (updateEntries, entries) => () => {
    if (!localState.addInputText) {
      return;
    }
    updateEntries(entries.concat(localState.addInputText));
    localState.addInputText = '';
  };

  const makeReplaceHandler = (updateEntries, entries) => (oldValue, newValue) => {
    updateEntries(entries.map(entry => entry === oldValue ? newValue : entry));
  };

  const makeDeleteHandler = (updateEntries, entries) => (value) => {
    updateEntries(entries.filter(entry => entry !== value));
  };

  const makeClearHandler = (updateEntries) => () => {
    if (!state.clearButtonWarn) {
      state.clearButtonWarn = true;
      return;
    }
    state.clearButtonWarn = false;
    updateEntries([]);
  };

  const makeExportHandler = () => () => {
    const payload = JSON.stringify(entries);
    const a = document.createElement('a');
    a.download = 'TotalSuspenderWhitelist.json';
    a.href = `data:application/octet-stream,${payload}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const makeImportHandler = (updateEntries, entries) => (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = ((fileContainer) => {
      const raw = fileContainer.target.result;
      const parsed = JSON.parse(raw);
      updateEntries(entries.concat(parsed))
    });
    reader.readAsText(file);
  };

  return {
    view: ({
      attrs: {
        entries,
        updateEntries,
      },
    }) => (
      <div>
        <TextInput
          prepend={(<span className="input-group-text">{browser.i18n.getMessage('titleAddURL')}</span>)}
          append={(
            <Button
              title={browser.i18n.getMessage('buttonAddEntry')}
              purpose="secondary"
              onclick={makeAddHandler(updateEntries, entries)}
            />
          )}
          value={localState.addInputText}
          oninput={(e) => { localState.addInputText = e.target.value; }}
        />
        <EditableList
          onEdit={makeReplaceHandler(updateEntries, entries)}
          onDelete={makeDeleteHandler(updateEntries, entries)}
          entries={entries}
          classes={{ listContainer: 'container mb-3' }}
        />

        <div className="d-flex justify-content-around align-items-center">
          <Button
            title={browser.i18n.getMessage('buttonExportList')}
            onclick={makeExportHandler()}
          />
          <FileInputButton
            title={browser.i18n.getMessage('buttonImportList')}
            onchange={makeImportHandler(updateEntries, entries)}
          />
          <Button
            title={browser.i18n.getMessage('buttonClearList')}
            onclick={makeClearHandler(updateEntries)}
            purpose={state.clearButtonWarn && 'warning'}
          />
        </div>
      </div>
    ),
  };
};

export default ControlledList;
