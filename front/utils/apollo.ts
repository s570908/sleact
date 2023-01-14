import { makeVar, ReactiveVar } from '@apollo/client';
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

interface IDateOne {
  date: string;
}

export const dateVarsList = new Map<string, ReactiveVar<IDateOne>>();

for (const [key, value] of Object.entries(initDate)) {
  console.log(`${key}: ${value}`);
  if (!key || !value) {
    continue;
  }
  dateVarsList.set(key, makeVar({ date: value }));
}

export const setDateVarsList = (workspace: string, chOrdmName: string, time?: string) => {
  const key = `${workspace}-${chOrdmName}`;
  if (time === undefined) {
    time = new Date().getTime().toString();
  }
  //time = new Date().getTime().toString();
  console.log('setDateVarsList--key: ', key, 'time: ', time, dayjs(new Date(+time)).format('YYYY-MM-DD-HH:mm:ss'));
  localStorage.setItem(key, time); // channel 페이지의 로딩 시점을 저장

  if (!dateVarsList.has(key)) {
    dateVarsList.set(key, makeVar({ date: time }));
  } else {
    let tmpVar = dateVarsList.get(key);
    tmpVar?.({ date: time });
  }

  const { date } = getDateInVarsList(workspace, chOrdmName);
  console.log(
    'setDateVarsList--dateInVar 확인: ',
    date,
    date ? dayjs(new Date(Number(date))).format('YYYY-MM-DD-HH:mm:ss') : 'No Date',
  );
};

export const getDateInVarsList = (workspace: string | undefined, chOrdmName: string): { date: string } => {
  //console.log('getDateInVar comes in');
  if (!workspace) {
    return { date: '0' };
  }
  const key = `${workspace}-${chOrdmName}`;
  if (!dateVarsList.has(key)) {
    console.log('Error: dateVarsList.has(key)--No Value');
    return { date: '0' };
  }
  const dateInVar = dateVarsList.get(key);
  if (!dateInVar) {
    return { date: '0' };
  }
  const { date: aDate } = dateInVar()!;
  console.log('getDateInVarsList() key: ', key, ' aDate: ', aDate);
  return { date: aDate ? aDate : '0' };
};
