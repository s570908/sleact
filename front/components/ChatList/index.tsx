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
        // scrollbarRef.current?.getScrollHeight() : fetcher가 setSize의 callback의 리턴값만큼 반복되어 수행된다.
        //    그 결과로 data는 array형태로, 한 페이지에 20개의 chat들이 들어 있고, 그러한 페이지가 callback의 리턴값만큼, 여러 페이지의 chat들이 들어 있게 된다.
        //    그리고 setSize().then()은 이벤트루프에 저장된다.
        //    그 data에 의하여 결국 <Scrollbars> 가 렌더된다. 그리하여 얻게 되는 전체 chatList의 높이가 이 값이다.
        //    그러한 상황에서 setSize()가 리턴한  promise는 fulfilled 상태로 전환되어 있다.
        //    이젠 이벤트 루프가 돌게 되는 시점이다. 그러므로 etSize().then()이 수행되고 그것의 callback이 수행된다.
        //    즉 scrollbarRef.current?.scrollTop(scrollbarRef.current?.getScrollHeight() - values.scrollHeight) 가 수행된다.
        //    이 때 values의 값은 onScroll(values)가 call될 때 이미 정해진 것으로 전달되는 클로져변수이다.
        //    onScroll()입장에서는 상수이다. 그리고 그 상수는 onScroll()이 call되는 시점에 정해지는 값이다.
        //    즉, 이전의 <Scrollbars>에 의한 chatList의 높이이다. 정리하면....
        // values.scrollHeight: 이전의 <Scrollbars>에 의한 chatList의 높이
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

/* 다음의 코드를 설명하자.
        
  const onScroll = useCallback(
    (values) => {
      if (values.scrollTop === 0 && !isReachingEnd && !isEmpty) {
        setSize((size) => size + 1).then(() => {
          scrollbarRef.current?.scrollTop(scrollbarRef.current?.getScrollHeight() - values.scrollHeight);
        });
      }
    },
    [setSize, scrollbarRef, isReachingEnd, isEmpty],
  );

setSize() 는 Promise를 return한다. 
setSize내의 callback function의 결과, 예를 들면 (size) => size + 1 를 수행한 결과 값이 5라고 가정하자.
index = 0, 1, 2, 3, 4  의 순서대로 하나씩 getIndex(index)를 돌려서 얻은 url을 이용하여
fetcher를 수행하여 얻은 결과를 data에 array형태로 적어 넣는다. 이 절차가 완성되면 이 promise의 상태는 fulfilled상태가 되고
promise.then()이 수행된다. 
추가로 더 설명을 하자면, 

fetcher가 setSize의 callback의 리턴값만큼 반복되어 수행된다.
그 결과로 data는 array형태로, 한 페이지에 20개의 chat들이 들어 있고, 그러한 페이지가 callback의 리턴값만큼 여러 페이지의 chat들이 들어 있게 된다.
그리고 setSize().then()은 이벤트루프에 저장된다.
그 data는 state이고 이 data의 벼화로 인해서 결국 <Scrollbars> 가 렌더된다. 그리하여 얻게 되는 전체 chatList의 높이가 이 값이다.
scrollbarRef.current?.getScrollHeight()

그러한 상황에서 setSize()가 리턴한  promise는 fulfilled 상태로 전환되어 있다.
이젠 이벤트 루프가 돌게 되는 시점이다. 그러므로 setSize().then()이 수행되고 그것의 callback이 수행된다.
즉 scrollbarRef.current?.scrollTop(scrollbarRef.current?.getScrollHeight() - values.scrollHeight) 가 수행된다.
이 때 values의 값은 onScroll(values)가 call될 때 이미 정해진 것으로 전달되는 클로져변수이다.
onScroll()입장에서는 상수이다. 그리고 그 상수는 onScroll()이 call되는 시점에 정해지는 값이다.
즉, 이전의 <Scrollbars>에 의한 chatList의 높이이다.
values.scrollHeight

scrollbarRef.current?.scrollTop(scrollbarRef.current?.getScrollHeight() - values.scrollHeight);
가 수행되어 보고 있던 chat에 계속 스크롤창이 머무르게 된다. 스크롤바는 약간 내려가게 된다. 
*/
