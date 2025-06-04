import type { Component, JSX } from 'solid-js';
import { Show } from 'solid-js';

interface BackdropProps {
  show: boolean;
  onClick: () => void;
}

const Backdrop: Component<BackdropProps> = (props) => {
  const handleBackdropClick = (event: MouseEvent) => {
    // Ensure the click is directly on the backdrop and not on a child element.
    if (event.target === event.currentTarget) {
      props.onClick();
    }
  };

  return (
    <Show when={props.show}>
      <div
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          'background-color': 'rgba(0, 0, 0, 0.5)',
          'z-index': '99', // Ensure it's above other content but below the modal
        }}
        onClick={handleBackdropClick}
      />
    </Show>
  );
};

export default Backdrop;
