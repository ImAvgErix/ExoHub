import { UiIcon } from './UiIcon'
import { host } from '../lib/host'

/** Hub is a fixed 1400×900 canvas — close only. Taskbar minimize stays native. */
export function WindowChrome() {
  return (
    <button
      type="button"
      className="exo-winbtn is-close"
      aria-label="Close"
      title="Close"
      onClick={() => void host.close()}
    >
      <UiIcon name="close" size={15} />
    </button>
  )
}
