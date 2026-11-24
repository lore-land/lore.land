/**
 * room-share.mjs — a room's line of Spw, and the two addresses that open it.
 *
 * The doorplate already shows the signature. With the share-line switch on,
 * each room can hand that line on: the line itself, a card at spw.quest, and
 * the canvas at factshift.center. Nothing is stored. The copy is the share.
 */

const QUEST = 'https://spw.quest/card?line=';
const CANVAS = 'https://factshift.center/?spw=';

/** The signature as one line, with the doorplate's spacing taken out. */
export function roomLine(text) {
  return String(text || '').replace(/\s+/g, '');
}

/** The line, then the card, then the canvas. */
export function sharePacket(line) {
  const encoded = encodeURIComponent(line);
  return `${line}\n${QUEST}${encoded}\n${CANVAS}${encoded}`;
}

/** Put a share control on every room doorplate. Hidden until the switch is on. */
export function initRoomShare({ announce } = {}) {
  const plates = document.querySelectorAll('main.chapter .room-doorplate');
  plates.forEach((plate) => {
    const line = roomLine(plate.querySelector('.room-sig')?.textContent);
    if (!line || plate.querySelector('.room-share')) {
      return;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'room-share';
    button.textContent = 'Share line';
    button.setAttribute('aria-label', `Copy ${line} and the addresses that open it`);
    button.addEventListener('click', async () => {
      const idle = 'Share line';
      try {
        await navigator.clipboard.writeText(sharePacket(line));
        button.textContent = 'Copied';
        announce?.('The room’s line and its addresses are copied.');
      } catch {
        button.textContent = 'Select the line';
        announce?.('Copy was refused. The line is in the doorplate.');
      }
      setTimeout(() => { button.textContent = idle; }, 1400);
    });
    plate.append(button);
  });
  return () => {
    plates.forEach((plate) => plate.querySelector('.room-share')?.remove());
  };
}
