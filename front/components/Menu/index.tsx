import { CreateMenu, CloseModalButton } from '@components/Menu/styles';
import React, { CSSProperties, FC, useCallback } from 'react';

// interface Props {
//   show: boolean;
//   onCloseModal: () => void;
//   style: CSSProperties;
//   closeButton?: boolean;
// }
interface Props {
  show: boolean;
  onCloseModal: (e: any) => void;
  style: CSSProperties;
  closeButton?: boolean;
}

const Menu: FC<Props> = ({ closeButton = true, children, style, show, onCloseModal }) => {
  const stopPropagation = useCallback((e: { stopPropagation: () => void }) => {
    e.stopPropagation();
  }, []);
  if (!show) {
    return null;
  }
  return (
    <CreateMenu onClick={onCloseModal}>
      <div style={style} onClick={stopPropagation}>
        {closeButton && <CloseModalButton onClick={onCloseModal}>&times;</CloseModalButton>}
        {children}
      </div>
    </CreateMenu>
  );
};

//const Menu: FC<PropsWithChildren<Props>> = ({ closeButton, style, show, children, onCloseModal }) => {
// const stopPropagation = useCallback((e) => {
//   e.stopPropagation();
// }, []);

// if (!show) {
//   return null;
// }
//   return (
//     <CreateMenu onClick={onCloseModal}>
//       <div onClick={stopPropagation} style={style}>
//         {closeButton && <CloseModalButton onClick={onCloseModal}>&times;</CloseModalButton>}
//         {children}
//       </div>
//     </CreateMenu>
//   );
// };
// Menu.defaultProps = {
//   closeButton: true,
// };

export default Menu;
