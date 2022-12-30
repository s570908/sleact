import { CreateModal, CloseModalButton } from '@components/Modal/styles';
import React, { FC, ReactNode, useCallback } from 'react';

// interface Props {
//   show: boolean;
//   onCloseModal: () => void;
// }

// const Modal: FC<PropsWithChildren<Props>> = ({ show, children, onCloseModal }) => {
//   const stopPropagation = useCallback((e) => {
//     e.stopPropagation();
//   }, []);

//   if (!show) {
//     return null;
//   }
//   return (
//     <CreateModal onClick={onCloseModal}>
//       <div onClick={stopPropagation}>
//         <CloseModalButton onClick={onCloseModal}>&times;</CloseModalButton>
//         {children}
//       </div>
//     </CreateModal>
//   );
// };

interface Props {
  show: boolean;
  onCloseModal: () => void;
  children: ReactNode;
}

const Modal: FC<Props> = ({ show, onCloseModal, children }: Props) => {
  const stopPropagation = useCallback((e) => {
    e.stopPropagation();
  }, []);

  if (!show) {
    return null;
  }
  return (
    <CreateModal onClick={onCloseModal}>
      <div onClick={stopPropagation}>
        <CloseModalButton onClick={onCloseModal}>&times;</CloseModalButton>
        {children}
      </div>
    </CreateModal>
  );
};

export default Modal;
