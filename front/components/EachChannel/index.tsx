import { IChannel, IUser } from '@typings/db';
import fetcher from '@utils/fetcher';
import React, { useEffect, useState, VFC } from 'react';
import { useParams } from 'react-router';
import { NavLink, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { dateInVar } from '@utils/apollo';
import { useReactiveVar } from '@apollo/client';

interface Props {
  channel: IChannel;
}
const EachChannel: VFC<Props> = ({ channel }) => {
  const { workspace } = useParams<{ workspace?: string }>();
  const location = useLocation();
  const { data: userData } = useSWR<IUser>('/api/users', fetcher, {
    dedupingInterval: 2000, // 2초
  });
  const dates = useReactiveVar(dateInVar);
  const key = `${workspace}-${channel.name}`;
  const date = dates?.[key] || '0';
  console.log('EachChannel--channel, date: ', channel.name, date);
  //const date = localStorage.getItem(`${workspace}-${channel.name}`) || 0;
  const { data: count, mutate } = useSWR<number>(
    userData ? `/api/workspaces/${workspace}/channels/${channel.name}/unreads?after=${date}` : null,
    fetcher,
  );
  const [showCount, setShowCount] = useState(true);

  useEffect(() => {
    mutate();
  }, [mutate, dates]);

  useEffect(() => {
    // 이 EachChannel--/workspace/${workspace}/channel/${channel.name}--이 내가 현재 보고 있는 Channel Chat--location.pathname--이면
    // 이 EachChannel에 보이는 unread message counter 는 0으로 만든다
    if (location.pathname === `/workspace/${workspace}/channel/${channel.name}`) {
      console.log(`/workspace/${workspace}/channel/${channel.name}`);
      setShowCount(false);
    } else {
      setShowCount(true);
    }
  }, [mutate, location.pathname, workspace, channel]);

  useEffect(() => {
    if (location.pathname === `/workspace/${workspace}/channel/${channel.name}`) {
      mutate(0);
    }
  }, [mutate, location.pathname, workspace, channel]);

  return (
    <NavLink key={channel.name} activeClassName="selected" to={`/workspace/${workspace}/channel/${channel.name}`}>
      <span className={count !== undefined && count > 0 ? 'bold' : undefined}># {channel.name}</span>
      {(showCount && count !== undefined && count > 0 && <span className="count">{count}</span>) || null}
    </NavLink>
  );
};

export default EachChannel;

// 특정 링크에 스타일을 넣어 줄 수 있다.
// ⭐⭐⭐ 이것이 바로 Link와 NavLink의 가장 큰 차이점이다.
