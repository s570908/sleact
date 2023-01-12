import { makeVar } from '@apollo/client';
import dayjs from 'dayjs';

interface IDate {
  [key: string]: string;
}

const initDate: IDate = { ...localStorage };

export const dateInVar = makeVar<IDate>(initDate);

// 현재 시간: new Date().getTime().toString()
export const setDateInVar = (workspace: string, chOrdmName: string, time?: string) => {
  const key = `${workspace}-${chOrdmName}`;
  if (time === undefined) {
    time = new Date().getTime().toString();
  }
  console.log('setDateInVar--key: ', key, 'time: ', time, dayjs(new Date(+time)).format('YYYY-MM-DD-HH:mm:ss'));
  localStorage.setItem(key, time); // channel 페이지의 로딩 시점을 저장
  const prevDates = dateInVar();
  const newDates = { ...prevDates, [key]: dayjs(+time).format('YYYY-MM-DD-HH:mm:ss') };
  console.log('localStorage.getItem(key): ', localStorage.getItem(key));
  console.log('newDates: ', newDates);
  console.log({ ...prevDates, [key]: dayjs(+time).format('YYYY-MM-DD-HH:mm:ss') });
  dateInVar({ ...prevDates, [key]: time });
  console.log(
    'dateInVar 확인: ',
    getDateInVar(workspace, chOrdmName),
    //dayjs(new Date(getDateInVar(workspace, chOrdmName).date)).format('YYYY-MM-DD-HH:mm:ss'),
  );
};

export const getDateInVar = (workspace: string | undefined, chOrdmName: string): { date: string } => {
  //console.log('getDateInVar comes in');
  if (!workspace) {
    return { date: '0' };
  }
  const dates = dateInVar();
  const key = `${workspace}-${chOrdmName}`;
  return { date: dates?.[key] || '0' };
};
