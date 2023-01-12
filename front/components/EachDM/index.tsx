import { IUser } from '@typings/db';
import fetcher from '@utils/fetcher';
import React, { useEffect, useState, VFC } from 'react';
import { useParams } from 'react-router';
import { NavLink, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { dateInVar } from '@utils/apollo';
import { useReactiveVar } from '@apollo/client';
import dayjs from 'dayjs';

interface Props {
  member: IUser;
  isOnline: boolean;
}
const EachDM: VFC<Props> = ({ member, isOnline }) => {
  const { workspace } = useParams<{ workspace?: string }>();
  const location = useLocation();
  const { data: userData } = useSWR<IUser>('/api/users', fetcher, {
    dedupingInterval: 2000, // 2초
  });
  const dates = useReactiveVar(dateInVar);
  const key = `${workspace}-${member.id}`;
  const date = dates?.[key] || '0';
  //const { date } = getDateInVar(workspace, String(member.id));
  //const date = localStorage.getItem(`${workspace}-${member.id}`) || 0;
  console.log('EachDM--member.id, date: ', member.id, date, dayjs(new Date(+date)).format('YYYY-MM-DD-HH:mm:ss'));
  const { data: count, mutate } = useSWR<number>(
    userData ? `/api/workspaces/${workspace}/dms/${member.id}/unreads?after=${date}` : null,
    fetcher,
  );
  const [showCount, setShowCount] = useState(true);

  useEffect(() => {
    mutate();
  }, [mutate, dates]);

  useEffect(() => {
    // 내가 현재 보고 있는 DM Chat(location.pathname === `/workspace/${workspace}/dm/${member.id}`)이면
    // EachDM에 보이는 unread message counter 는 0으로 만든다
    if (location.pathname === `/workspace/${workspace}/dm/${member.id}`) {
      console.log(`현재 패이지는 /workspace/${workspace}/dm/${member.id}`);
      setShowCount(false);
    } else {
      setShowCount(true);
    }
  }, [mutate, location.pathname, workspace, member]);

  return (
    <NavLink key={member.id} activeClassName="selected" to={`/workspace/${workspace}/dm/${member.id}`}>
      <i
        className={`c-icon p-channel_sidebar__presence_icon p-channel_sidebar__presence_icon--dim_enabled c-presence ${
          isOnline ? 'c-presence--active c-icon--presence-online' : 'c-icon--presence-offline'
        }`}
        aria-hidden="true"
        data-qa="presence_indicator"
        data-qa-presence-self="false"
        data-qa-presence-active="false"
        data-qa-presence-dnd="false"
      />
      <span className={count && count > 0 ? 'bold' : undefined}>{member.nickname}</span>
      {member.id === userData?.id && <span> (나)</span>}
      {(showCount && count && count > 0 && <span className="count">{count}</span>) || null}
    </NavLink>
  );
};

export default EachDM;
