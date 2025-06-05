import { Component, Show } from 'solid-js';
import styles from './CreateYouTubePlaylistModal.module.css';

interface CreateYouTubePlaylistModalProps {
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
  onCreate: (playlistName: string) => Promise<void>;
}

const CreateYouTubePlaylistModal: Component<CreateYouTubePlaylistModalProps> = (props) => {
  let playlistNameInput: HTMLInputElement | undefined;

  const handleCreateClick = async () => {
    if (playlistNameInput && playlistNameInput.value.trim() !== '') {
      await props.onCreate(playlistNameInput.value.trim());
      // Modal is typically closed by the caller after onCreate finishes
    } else {
      alert('Playlist name cannot be empty.');
      // TODO: Replace alert with a more integrated error message
    }
  };

  return (
    <Show when={props.isOpen}>
      <div class={styles.modalOverlay}>
        <div class={styles.modalContent}>
          <h2>Create YouTube Playlist</h2>
          <Show when={props.isCreating}>
            <p>Creating playlist, please wait...</p>
          </Show>
          <div class={styles.inputGroup}>
            <label for="playlistName">Playlist Name:</label>
            <input
              type="text"
              id="playlistName"
              ref={playlistNameInput}
              readOnly={props.isCreating}
              disabled={props.isCreating} /* Also disable for visual cue and to prevent focus */
            />
          </div>
          <div class={styles.buttonGroup}>
            <button
              onClick={props.onClose}
              class={styles.cancelButton}
              disabled={props.isCreating}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateClick}
              class={styles.createButton}
              disabled={props.isCreating || (playlistNameInput && playlistNameInput.value.trim() === '')}
            >
              {props.isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default CreateYouTubePlaylistModal;
