export const popupClose = (action = () => {}, duration = 500) => {
  setTimeout(() => {
    action({ openPopup: false });
  }, duration);
};
