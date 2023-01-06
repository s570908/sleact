import { IChat, IDM } from '@typings/db';
import dayjs from 'dayjs';

export default function makeSection<T extends IDM | IChat>(chatList: T[]) {
  const sections: { [key: string]: T[] } = {};
  chatList.forEach((chat) => {
    const monthDate = dayjs(chat.createdAt).format('YYYY-MM-DD');
    if (Array.isArray(sections[monthDate])) {
      sections[monthDate].push(chat);
    } else {
      sections[monthDate] = [chat];
    }
  });
  return sections;
}

/*
chatList = [ (id:1, date:'2021-02-13'), (id:2, date:'2021-02-14'), (id:3, date:'2021-02-15'), (id:4, date:'2021-02-13'), (id:5, date:'2021-02-13')]
sections = { 
  '2021-02-13': [1, 4, 5],
  '2021-02-14': [2],
  '2021-02-15': [3],
}
sections type { [date: string]: [chat] }

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
