import { ChatWrapper } from '@components/Chat/styles';
import { IChat, IDM, IUser } from '@typings/db';
import dayjs from 'dayjs';
import gravatar from 'gravatar';
import React, { FC, useMemo, memo } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import regexifyString from 'regexify-string';

interface Props {
  data: IDM | IChat;
}

const BACK_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:3095' : 'https://sleact.nodebird.com';
const Chat: FC<Props> = memo(({ data }) => {
  const { workspace } = useParams<{ workspace: string; channel: string }>();
  const user: IUser = 'Sender' in data ? data.Sender : data.User;

  const result = useMemo<(string | JSX.Element)[] | JSX.Element>(() => {
    //console.log('Chat--result: ', `${BACK_URL}/${data.content}`);
    // 전달된 chat data가 upload\\서버주소 로 시작을 하면 image tag로 바꾼다.
    return data.content.startsWith('uploads\\') || data.content.startsWith('uploads/') ? (
      <>
        <img src={`${BACK_URL}/${data.content}`} style={{ maxHeight: 200 }} />
      </>
    ) : (
      // @[제로초1](7)
      //    \d 숫자 +는 1개 이상  ?는 0개나 1개  *는 0개 이상  .는 문자  g는 모두 찾기
      //    .+는 최대한 많이 찾는다     .+?는 최소한으로 찾는다
      regexifyString({
        pattern: /@\[(.+?)]\((\d+?)\)|\n/g,
        decorator(match, index) {
          const arr: string[] | null = match.match(/@\[(.+?)]\((\d+?)\)/)!;
          //console.log('arr: ', arr);
          if (arr) {
            return (
              <Link key={match + index} to={`/workspace/${workspace}/dm/${arr[2]}`}>
                @{arr[1]}
              </Link>
            );
          }
          return <br key={index} />;
        },
        input: data.content,
      })
    );
  }, [data.content, workspace]);

  return (
    <ChatWrapper>
      <div className="chat-img">
        <img src={gravatar.url(user.email, { s: '36px', d: 'retro' })} alt={user.nickname} />
      </div>
      <div className="chat-text">
        <div className="chat-user">
          <b>{user.nickname}</b>
          <span>{dayjs(data.createdAt).format('h:mm A')}</span>
        </div>
        <p>{result}</p>
      </div>
    </ChatWrapper>
  );
});

export default Chat;

// Type guard: 두개 이상의 타잎이 겹쳐있을 때 타잎을 찾아내는 방법.
// 'Sender' in data
/* 
function a(b: number | string | number[]) {
  if(typeof b === 'number') {
    b.toFixed() // OK
  }
  if(typeof b ==='string) {
    b.slice() // OK
  }
  if(Array.isArray(b)) {
    b.forEach(()=>{}) // OK
  }
  b.toFixed() // 에러
  b.slice() // 에러
}
*/
