import Chat from '@components/Chat';
import { ChatZone, Section, StickyHeader } from '@components/ChatList/styles';
import { IChat, IDM } from '@typings/db';
import React, { VFC, RefObject, useCallback } from 'react';
import { Scrollbars } from 'react-custom-scrollbars-2';

interface Props {
  scrollbarRef: RefObject<Scrollbars>;
  isReachingEnd?: boolean;
  isEmpty: boolean;
  chatSections: { [key: string]: (IDM | IChat)[] };
  setSize: (f: (size: number) => number) => Promise<(IDM | IChat)[][] | undefined>;
}
const ChatList: VFC<Props> = ({ scrollbarRef, isReachingEnd, isEmpty, chatSections, setSize }) => {
  const onScroll = useCallback(
    (values) => {
      //console.log('onScroll event--values: ', values);
      //console.log('scrollbarRef.current?.getScrollHeight(): ', scrollbarRef.current?.getScrollHeight());
      if (values.scrollTop === 0 && !isReachingEnd && !isEmpty) {
        // 스크롤이 맨위에 도달하면,
        // chatData가 비었는지 혹은 스크롤이 맨 아래에 도달했나를 체크하고
        // 그도 저도 아니면,  page를 하나 더 증가시킨다.
        // page 하나가 더 증가되고 나서 스크롤을 맨 위로 올리면 안된다. 지금 보고 있는 chat에서 스크롤이 머물러 있도록 해야 한다.
        // 결론은, 지금 현재 scroll height에서 scrollbar의 scroll height를 뺀다.
        // 관찰: 스크롤이
        setSize((size) => size + 1).then(() => {
          // console.log('setSize()가 fulfill되고 then() 수행 시작입니다.');
          // console.log('values: ', values); // <Scrollbar>를 렌더링하기 전의 값.
          // console.log('scrollbarRef.current?.getScrollHeight(): ', scrollbarRef.current?.getScrollHeight()); //<Scrollbar>를 렌더링한 후의 값.
          // console.log('values.scrollHeight: ', values.scrollHeight);
          scrollbarRef.current?.scrollTop(scrollbarRef.current?.getScrollHeight() - values.scrollHeight);
        });
      }
    },
    [setSize, scrollbarRef, isReachingEnd, isEmpty],
  );

  //console.log('지금 <Scrollbars> 컴포넌트가 렌더되고 있습니다.');

  return (
    <ChatZone>
      <Scrollbars autoHide ref={scrollbarRef} onScrollFrame={onScroll}>
        {Object.entries(chatSections).map(([date, chats]) => {
          return (
            <Section className={`section-${date}`} key={date}>
              <StickyHeader>
                <button>{date}</button>
              </StickyHeader>
              {chats.map((chat) => (
                <Chat key={chat.id} data={chat} />
              ))}
            </Section>
          );
        })}
      </Scrollbars>
    </ChatZone>
  );
};

export default ChatList;

/* chatSections.map은 사용불가. 왜냐하면 chatSections는 object이기 때문이다.
Object.entries(chatSections)는 chatSections를 이용하여 array를 만든다. 
chatSections type { [date: string]: [chat] }
Object.entries(chatSections) [ [date, [chat]], [date, [chat]], [date, [chat]] ]

const sections = { 
  '2021-02-13': [1, 4, 5],
  '2021-02-14': [2],
  '2021-02-15': [3],
}

console.log(Object.entries(sections))

[ 
  ["2021-02-13", [1, 4, 5]], 
  ["2021-02-14", [2]], 
  ["2021-02-15", [3]] 
]
*/
