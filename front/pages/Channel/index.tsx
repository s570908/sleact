import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import InviteChannelModal from '@components/InviteChannelModal';
import useInput from '@hooks/useInput';
import useSocket from '@hooks/useSocket';
//import Workspace from '@layouts/Workspace';
import { Header, Container, DragOver } from '@pages/Channel/styles';
import { IChannel, IChat, IUser } from '@typings/db';
import fetcher from '@utils/fetcher';
import makeSection from '@utils/makeSection';
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { useParams } from 'react-router';
import { Redirect } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { setDateInVar, getDateInVar } from '@utils/apollo';

const PAGE_SIZE = 20;
const Channel = () => {
  const { workspace, channel } = useParams<{ workspace: string; channel: string }>();
  const [socket] = useSocket(workspace);
  const { data: userData } = useSWR<IUser>('/api/users', fetcher);
  const { data: channelsData } = useSWR<IChannel[]>(`/api/workspaces/${workspace}/channels`, fetcher);
  const channelData = channelsData?.find((v) => v.name === channel);
  const {
    data: chatData,
    mutate: mutateChat,
    setSize,
  } = useSWRInfinite<IChat[]>(
    (index) => `/api/workspaces/${workspace}/channels/${channel}/chats?perPage=${PAGE_SIZE}&page=${index + 1}`,
    fetcher,
    {
      onSuccess(data) {
        console.log('Channel--chats: ', data);
        if (data?.length === 1) {
          setTimeout(() => {
            scrollbarRef.current?.scrollToBottom();
          }, 100);
        }
      },
    },
  );
  const { data: channelMembersData } = useSWR<IUser[]>(
    userData ? `/api/workspaces/${workspace}/channels/${channel}/members` : null,
    fetcher,
  );
  const [chat, onChangeChat, setChat] = useInput('');
  const [showInviteChannelModal, setShowInviteChannelModal] = useState(false);
  const scrollbarRef = useRef<Scrollbars>(null);
  const [dragOver, setDragOver] = useState(false);

  /*
  useSWRInfinite
  
   optional chaining ?.[i] 사용됨: array?.[i]  좌측 operand가 null undefined 이 아니면 array[i]를 가져와라.
   chatData는 최대 20개의 chat을 갖고 있는 array이다.
   chatDat[0] 에 20개의 chat
   chatDat[1] 에 20개의 chat
   chatDat[2] 에 20개의 chat
   chatDat[3] 에 4개의 chat
    chatData = 
    [ 
      [{id:1}, ..., {id:20}], 
      [{id:21}, ..., {id:30}], 
      [{id:31}, ..., {id:40}], 
      [{id:41}, ..., {id:44}]
    ]
  */

  const isEmpty = chatData?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (chatData && chatData[chatData.length - 1]?.length < PAGE_SIZE);

  const onCloseModal = useCallback(() => {
    setShowInviteChannelModal(false);
  }, []);

  const onSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      //console.log('submit');
      setChat('');
      if (chat?.trim() && chatData && channelData && userData) {
        const savedChat = chat;
        mutateChat((prevChatData) => {
          prevChatData?.[0].unshift({
            id: (chatData[0][0]?.id || 0) + 1,
            content: savedChat,
            UserId: userData.id,
            User: userData,
            createdAt: new Date(),
            ChannelId: channelData.id,
            Channel: channelData,
          });
          return prevChatData;
          // options: false 이어야 한다. revalidate하지 않는다.
          // 즉 서버로 부터 데이터를 가져와서 캐시를 업데이트하지 않는다.
          // 서버와 캐시의 데이터가 불일치하도록 놔둔다.
        }, false).then(() => {
          setChat('');
          if (scrollbarRef.current) {
            console.log('scrollToBottom!', scrollbarRef.current?.getValues());
            // 채팅을 입력하였을 때 스크롤을 제일 아래로 내린다.
            scrollbarRef.current.scrollToBottom();
          }
        });
        // 서버에 입력된 chat 전송
        axios
          .post(`/api/workspaces/${workspace}/channels/${channel}/chats`, {
            content: savedChat,
          })
          .then(() => {
            // 서버에 요청하여 chat list를 전달받는다.
            mutateChat();
            setDateInVar(workspace, channel); // chat 입력 시점을 저장
            //localStorage.setItem(`${workspace}-${channel}`, new Date().getTime().toString()); // chat 입력 시점을 저장
          })
          .catch(console.error);
      }
    },
    [chat, workspace, channel, channelData, userData, chatData, mutateChat, setChat],
  );

  // 서버가 가장 최신 데이터를 이벤트로 보내주었으므로 캐시를 갱신하면 된다.
  const onMessage = useCallback(
    (data: IChat) => {
      console.log(
        'onMessage entered--chat이 message 이벤트로 들어 왔다. ',
        '보낸자: ',
        data.UserId,
        '현재  EachChannel channel 이름: ',
        channel,
        '로그인 user: ',
        userData?.id,
      );
      // channel message를 전송한 channel 이 현재 보고 있는 channel이 아닐 경우
      // wake up EachChannel of channel message를 전송한 channel
      if (data.Channel.name !== channel) {
        const { date } = getDateInVar(workspace, data.Channel.name);
        setDateInVar(workspace, data.Channel.name, date);
      }
      // channel message를 전송한 channel 이 현재 보고 있는 channel 이고
      // 이미지 업로드에 의한 이벤트이거나 혹은
      // id는 상대방id.  내가 전송한 chat이 아니고 상대방이 전송한 chat일 경우
      if (
        data.Channel.name === channel &&
        (data.content.startsWith('uploads\\') || data.content.startsWith('uploads/') || data.UserId !== userData?.id)
      ) {
        console.log('업로드 이미지이거나 혹은 내가 아닌 상대방이 전송한 채널 message 이벤트가 들어 왔다.');
        setDateInVar(workspace, channel);
        mutateChat().then(() => {
          if (scrollbarRef.current) {
            if (
              scrollbarRef.current.getScrollHeight() <
              scrollbarRef.current.getClientHeight() + scrollbarRef.current.getScrollTop() + 150
            ) {
              console.log('scrollToBottom!', scrollbarRef.current?.getValues());
              setTimeout(() => {
                scrollbarRef.current?.scrollToBottom();
              }, 100);
            } else {
              toast.success('새 메시지가 도착했습니다.', {
                onClick() {
                  scrollbarRef.current?.scrollToBottom();
                },
                closeOnClick: true,
              });
            }
          }
        });
      }
    },
    [channel, userData, workspace, mutateChat],
  );

  useEffect(() => {
    socket?.on('message', onMessage);
    return () => {
      socket?.off('message', onMessage);
    };
  }, [socket, onMessage]);

  useEffect(() => {
    setDateInVar(workspace, channel); // channel 페이지의 로딩 시점을 저장
    // localStorage.setItem(key, time); // channel 페이지의 로딩 시점을 저장
  }, [workspace, channel]);

  const onClickInviteChannel = useCallback(() => {
    setShowInviteChannelModal(true);
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      // console.log(e);
      // console.log('e.dataTransfer.items: ', e.dataTransfer.items);
      // console.log('e.dataTransfer.files: ', e.dataTransfer.files);
      const formData = new FormData();
      if (e.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < e.dataTransfer.items.length; i++) {
          // If dropped items aren't files, reject them
          //console.log(e.dataTransfer.items[i]);
          if (e.dataTransfer.items[i].kind === 'file') {
            const file = e.dataTransfer.items[i].getAsFile();
            //console.log(e, '.... file[' + i + '].name = ' + file.name);
            formData.append('image', file);
          }
        }
      } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          console.log(e, '... file[' + i + '].name = ' + e.dataTransfer.files[i].name);
          formData.append('image', e.dataTransfer.files[i]);
        }
      }
      axios.post(`/api/workspaces/${workspace}/channels/${channel}/images`, formData).then(() => {
        setDragOver(false);
        setDateInVar(workspace, channel); // image 업로드 시점을 저장
        //localStorage.setItem(`${workspace}-${channel}`, new Date().getTime().toString()); // image 업로드 시점을 저장
        //mutateChat(); // 이렇게 코멘트 처리하여야 한다. channel message 이벤트가 들어 올 때, 즉 onMeaasge()에서 서버에서 chat을 가져오고
        //캐시를 업데이트한다. 즉, mutateChat().then(...)으로 처리한다.
      });
    },
    [workspace, channel],
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    //console.log('onDragOver: e', e);
    setDragOver(true);
  }, []);

  if (channelsData && !channelData) {
    return <Redirect to={`/workspace/${workspace}/channel/일반`} />;
  }

  const chatSections = makeSection(chatData ? ([] as IChat[]).concat(...chatData).reverse() : []);

  return (
    <Container onDrop={onDrop} onDragOver={onDragOver}>
      <Header>
        <span>#{channel}</span>
        <div style={{ display: 'flex', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          <span>{channelMembersData?.length}</span>
          <button
            onClick={onClickInviteChannel}
            className="c-button-unstyled p-ia__view_header__button"
            aria-label="Add people to #react-native"
            data-sk="tooltip_parent"
            type="button">
            <i className="c-icon p-ia__view_header__button_icon c-icon--add-user" aria-hidden="true" />
          </button>
        </div>
      </Header>
      <ChatList
        scrollbarRef={scrollbarRef}
        isReachingEnd={isReachingEnd}
        isEmpty={isEmpty}
        chatSections={chatSections}
        setSize={setSize}
      />
      <ChatBox
        onSubmitForm={onSubmitForm}
        chat={chat}
        onChangeChat={onChangeChat}
        placeholder={`Message #${channel}`}
        data={channelMembersData}
      />
      <InviteChannelModal
        show={showInviteChannelModal}
        onCloseModal={onCloseModal}
        setShowInviteChannelModal={setShowInviteChannelModal}
      />
      <ToastContainer position="bottom-center" />
      {dragOver && <DragOver>업로드!</DragOver>}
    </Container>
  );
};

export default Channel;

/* Optimistic UI
0초   A: 안녕 // Optimistic UI
1초   B: 안녕
2초   A: 안녕 // 실제 서버가 전송

A 화면-- A의 네트워크를 3G slow로 변경햐여 실험을 하면 아래의 현상을 볼 수 있다.
0초   A: 안녕 // Optimistic UI
1초   B: 안녕

B 화면--
1초   B: 안녕
2초   A: 안녕 // 실제 서버가 전송

A가 입력한 chat을 서버로 보내고 난 후에, 반드시 서버로 부터 chat을 받아서 다시 A화면을 렌더링해야 한다. 즉, mutateChat()을 수행시켜야 한다.
        axios
          .post(`/api/workspaces/${workspace}/channels/${channel}/chats`, {
            content: savedChat,
          })
          .then(() => {
            mutateChat(); //   <====== mutateChat()을 수행시켜야 한다.
          })
          .catch(console.error);

A 화면이

0초   A: 안녕 // Optimistic UI
1초   B: 안녕

에서 

1초   B: 안녕
2초   A: 안녕 // 실제 서버가 전송

로 전환된다.

결과적으로 A화면과 B화면은 일치하게 된다. 
*/

/*
image file을 선택하여 업로드하기

<input type=”file” multiple onChange={onChangeFile} />

const onChangeFile = useCallback(
  (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (e.target.files) {
      for (let i = 0; i < e.target.files.length; i++) {
        console.log(e.target.files[i]);
        if (e.target.files[i].kind === 'file') {
          const file = e.dataTransfer.files[i].getAsFile();
          console.log(e, '.... file[' + i + '].name = ' + file.name);
          formData.append('image', file);
        }
      }
    }
    axios.post(`/api/workspaces/${workspace}/channels/${channel}/images`, formData).then(() => {
      setDragOver(false);
      localStorage.setItem(`${workspace}-${channel}`, new Date().getTime().toString());
    });
  },
  [workspace, channel],
);

*/
