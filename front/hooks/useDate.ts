import useSWR, { mutate } from 'swr';
// import dayjs from 'dayjs';

interface IKeydate {
  cacheKey: string;
  cacheDate: string;
}

interface IDate {
  [key: string]: string;
}

interface IDateOne {
  date: string;
}

const initDate: IDate = { ...localStorage };
const dateList = new Map<string, IDateOne>();

for (const [key, value] of Object.entries(initDate)) {
  if (!key || !value) {
    continue;
  }
  dateList.set(key, { date: value });
  //console.log(`${key}: ${value}: `, dateList);
}

const fetcherDate = async (key: string) => {
  if (!dateList.has(key)) {
    //console.log('dateList.has(key) inititialized because dateList.has(key)--No Value');
    return Promise.resolve(null);
  }
  const value = dateList.get(key);
  //console.log('fetcherDate--key, value ', key, value);
  if (!value) {
    return Promise.resolve(null);
  } else {
    return Promise.resolve(value);
  }
};

export const setDate = ({ cacheKey, cacheDate: newDate }: IKeydate) => {
  //console.log('setDate--cacheKey, cacheDate ', cacheKey, newDate);
  localStorage.setItem(cacheKey, newDate);
  dateList.set(cacheKey, { date: newDate });
  mutate(cacheKey, fetcherDate);
};

export const getDate = (cacheKey: string): string => {
  const date = localStorage.getItem(cacheKey);
  return date ?? '0';
};

export default function (key: any) {
  const { data: date, mutate: mutateDate } = useSWR(key, fetcherDate, {
    revalidateOnFocus: false,
  });
  //console.log('useSWR(key, fetcherDate)--key date ', key, date);
  return {
    date,
    mutateDate,
  };
}

// 7.1 Promise.resolve/Promise.reject
// Promise.resolve와 Promise.reject 메소드는 존재하는 값을 Promise로 래핑하기 위해 사용한다.

// 정적 메소드 Promise.resolve 메소드는 인자로 전달된 값을 resolve하는 Promise를 생성한다.
// https://poiemaweb.com/es6-promise

// import dayjs from 'dayjs';

/****************************

export interface IDate {
  [key: string]: string;
}

const initDate: IDate = { ...localStorage };

// 현재 시간: new Date().getTime().toString()
export const setLastReadDate = (workspace: string, chOrdmName: string, time?: string) => {
  const key = `${workspace}-${chOrdmName}`;
  if (time === undefined) {
    time = new Date().getTime().toString();
  }
  //console.log('setDateInVar--key: ', key, 'time: ', time, dayjs(new Date(+time)).format('YYYY-MM-DD-HH:mm:ss'));
  localStorage.setItem(key, time); // 새로운 시점을 저장
  const prevDates = dateInVar();
  //const newDates = { ...prevDates, [key]: dayjs(+time).format('YYYY-MM-DD-HH:mm:ss') };
  // console.log('localStorage.getItem(key): ', localStorage.getItem(key));
  // console.log('newDates: ', newDates);
  // console.log({ ...prevDates, [key]: dayjs(+time).format('YYYY-MM-DD-HH:mm:ss') });
  dateInVar({ ...prevDates, [key]: time });
  // console.log(
  //   'dateInVar 확인: ',
  //   getDateInVar(workspace, chOrdmName),
  //   //dayjs(new Date(getDateInVar(workspace, chOrdmName).date)).format('YYYY-MM-DD-HH:mm:ss'),
  // );
};

export const getLastReadDate = (workspace: string | undefined, chOrdmName: string): { date: string } => {
  //console.log('getDateInVar comes in');
  if (!workspace) {
    return { date: '0' };
  }
  const dates = dateInVar();
  const key = `${workspace}-${chOrdmName}`;
  return { date: dates?.[key] || '0' };
};

*******************/
