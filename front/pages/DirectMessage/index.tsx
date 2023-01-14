import ChatBox from '@components/ChatBox';
import ChatList from '@components/ChatList';
import useInput from '@hooks/useInput';
import useSocket from '@hooks/useSocket';
//import Workspace from '@layouts/Workspace';
import { DragOver } from '@pages/Channel/styles';
import { Header, Container } from '@pages/DirectMessage/styles';
import { IChat, IDM } from '@typings/db';
import fetcher from '@utils/fetcher';
import makeSection from '@utils/makeSection';
import axios from 'axios';
import gravatar from 'gravatar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { useParams } from 'react-router';
import { toast } from 'react-toastify';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { setDateVarsList, getDateInVarsList } from '@utils/apollo';

const PAGE_SIZE = 20;
const DirectMessage = () => {
  const { workspace, id } = useParams<{ workspace: string; id: string }>();
  const [socket] = useSocket(workspace);
  const { data: myData } = useSWR('/api/users', fetcher);
  const { data: userData } = useSWR(`/api/workspaces/${workspace}/users/${id}`, fetcher);
  const {
    data: chatData,
    mutate: mutateChat,
    setSize,
  } = useSWRInfinite<IDM[]>(
    (index) => {
      //console.log('useSWRInfinite--getKey.index: ', index);
      return `/api/workspaces/${workspace}/dms/${id}/chats?perPage=${PAGE_SIZE}&page=${index + 1}`;
    },
    fetcher,
    {
      onSuccess(data) {
        //console.log('DM--chats: ', data);
        if (data?.length === 1) {
          // 로딩 시에는 스크롤바를 제일 아래로 내린다.
          setTimeout(() => {
            scrollbarRef.current?.scrollToBottom();
          }, 100);
        }
      },
    },
  );
  const [chat, onChangeChat, setChat] = useInput('');
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

  const onSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      if (chat?.trim() && chatData) {
        /* optimistic UI
        // 서버에 chat data를 보내기 전에 chat을 미리 만들어서 cache에 저장하여 채팅창에 렌더링되게 한다.
        // cache에 저장하기 위해서 mutateChat(callback)을 사용한다. callback을 수행시켜서 리턴된 값으로 캐시를 업데이트한다.
          callback(prev) {
              prevChatData를 이용하여 prevChatData의 맨 앞에 미리 만들어진 chat을 추가하여 변형시키고...
              return prevChatData
          }
        */
        const savedChat = chat;
        mutateChat((prevChatData) => {
          prevChatData?.[0].unshift({
            id: (chatData[0][0]?.id || 0) + 1,
            content: savedChat,
            SenderId: myData.id,
            Sender: myData,
            ReceiverId: userData.id,
            Receiver: userData,
            createdAt: new Date(),
          });
          return prevChatData;
          // options: false 이어야 한다. revalidate하지 않는다.
          // 즉 서버로 부터 데이터를 가져와서 캐시를 업데이트하지 않는다.
          // 서버와 캐시의 데이터가 불일치하도록 놔둔다.
        }, false).then(() => {
          setChat('');
          if (scrollbarRef.current) {
            //console.log('scrollToBottom!', scrollbarRef.current?.getValues());
            // 채팅을 입력하였을 때 스크롤을 제일 아래로 내린다.
            scrollbarRef.current.scrollToBottom();
          }
        });
        // 입력된 chat을 서버에 전송
        axios
          .post(`/api/workspaces/${workspace}/dms/${id}/chats`, {
            content: chat,
          })
          .then(() => {
            // 서버에 요청하여 chat list를 전달받는다.
            mutateChat();
            //setDateInVar(workspace, id); // chat 입력 시점을 저장
            setDateVarsList(workspace, id);
            //localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString()); // chat 입력 시점을 저장
          })
          .catch(console.error);
      }
    },
    [chat, workspace, id, myData, userData, chatData, mutateChat, setChat],
  );

  // 서버가 가장 최신 데이터를 이벤트로 보내주었으므로 캐시를 갱신하면 된다.
  const onMessage = useCallback(
    (data: IDM) => {
      console.log(
        'onMessage entered--chat이 dm 이벤트로 들어 왔다. ',
        '보낸자: ',
        data.SenderId,
        '현재  EachDM Chat User: ',
        id,
        '로그인 user: ',
        myData.id,
      );
      // dm message를 전송한 dm 이 현재 보고 있는 dm이 아닐 경우
      if (data.SenderId !== Number(id)) {
        const { date } = getDateInVarsList(workspace, String(data.SenderId));
        //setDateInVar(workspace, String(data.SenderId), date);
        setDateVarsList(workspace, String(data.SenderId), date);
      }
      // dm message를 전송한 dm 이 현재 보고 있는 dm 이고
      // id는 상대방id.  내가 전송한 chat이 아니고 상대방이 전송한 chat일 경우
      if (data.SenderId === Number(id) && myData.id !== Number(id)) {
        console.log('내가 아닌 상대방이 전송한 chat이 이벤트로 들어 왔다.');
        //setDateInVar(workspace, id);
        setDateVarsList(workspace, id);
        mutateChat().then(() => {
          if (scrollbarRef.current) {
            // client의 bottom: scrollbarRef.current.getClientHeight() + scrollbarRef.current.getScrollTop()
            // scroll의 bottom: scrollbarRef.current.getScrollHeight()
            // client의 bottom이 scroll의 bottom보다 150이하일 경우에는 client를 아래로 내린다.
            if (
              scrollbarRef.current.getScrollHeight() <
              scrollbarRef.current.getClientHeight() + scrollbarRef.current.getScrollTop() + 150
            ) {
              console.log('scrollToBottom!', scrollbarRef.current?.getValues());
              scrollbarRef.current?.scrollToBottom();
              // setTimeout(() => {
              //   scrollbarRef.current?.scrollToBottom();
              // }, 100);
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
    [id, myData, workspace, mutateChat],
  );

  const onMessageChannel = useCallback(
    (data: IChat) => {
      console.log(
        'onMessage entered--chat이 message 이벤트로 들어 왔다. ',
        '보낸 자: ',
        data.UserId,
        ' 보낸 채널: ',
        data.Channel.name,
      );
      const { date } = getDateInVarsList(workspace, String(data.Channel.name));
      //setDateInVar(workspace, String(data.Channel.name), date);
      setDateVarsList(workspace, String(data.Channel.name), date);
    },
    [workspace],
  );

  useEffect(() => {
    socket?.on('dm', onMessage);
    return () => {
      socket?.off('dm', onMessage);
    };
  }, [socket, onMessage]);

  useEffect(() => {
    socket?.on('message', onMessageChannel);
    return () => {
      socket?.off('message', onMessageChannel);
    };
  }, [socket, onMessageChannel]);

  useEffect(() => {
    //setDateInVar(workspace, id);
    setDateVarsList(workspace, id);
    //localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString()); // DM 페이지의 로딩 시점을 저장
  }, [workspace, id]);

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
          if (e.dataTransfer.items[i].kind === 'file') {
            const file = e.dataTransfer.items[i].getAsFile();
            //console.log('... file[' + i + '].name = ' + file.name);
            formData.append('image', file);
          }
        }
      } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          //console.log('... file[' + i + '].name = ' + e.dataTransfer.files[i].name);
          formData.append('image', e.dataTransfer.files[i]);
        }
      }
      axios.post(`/api/workspaces/${workspace}/dms/${id}/images`, formData).then(() => {
        setDragOver(false);
        //setDateInVar(workspace, id);
        setDateVarsList(workspace, id);
        //localStorage.setItem(`${workspace}-${id}`, new Date().getTime().toString()); // image 업로드 시점을 저장
        mutateChat();
      });
    },
    [workspace, id, mutateChat],
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    //console.log('onDragOver: e', e);
    setDragOver(true);
  }, []);

  if (!userData || !myData) {
    return null;
  }

  // chatData.reverse() : chatData가 변한다. 즉 chatData 자체를 reverse한다.
  // [].concat(...chatData).reverse() : 새로운 chatData를 만든 후에 이것을 reverse한다.
  const chatSections = makeSection(chatData ? ([] as IDM[]).concat(...chatData).reverse() : []);

  return (
    <Container onDrop={onDrop} onDragOver={onDragOver}>
      <Header>
        <img src={gravatar.url(userData.email, { s: '24px', d: 'retro' })} alt={userData.nickname} />
        <span>{userData.nickname}</span>
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
        placeholder={`Message ${userData.nickname}`}
        data={[]}
      />
      {dragOver && <DragOver>업로드!</DragOver>}
    </Container>
  );
};

export default DirectMessage;
