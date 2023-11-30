import moment from 'moment-timezone';
import { IFriendResult } from '../modules/friends/models/friend';

export function formatFriendsData(friends: IFriendResult[]) {
    const result = {
        today: [] as IFriendResult[],
        thisWeek: [] as IFriendResult[],
        thisMonth: [] as IFriendResult[],
        laterOn: [] as IFriendResult[],
    }

    friends.forEach((friend, index) => {
        // randomly assign card color
        const colorIndex = index % presentlyCardColors.length;
        friend['cardColor'] = presentlyCardColors[colorIndex];

        if (friend.daysUntilBirthday === 0) result.today.push(friend);
        else if (friend.daysUntilBirthday <= 31) {
            const category = categorizeBirthday(friend.dob); // determines if the birthday lands in calendar week or just calendar month
            if (category === 'thisWeek' || category === 'thisMonth') result[category].push(friend); // pushes according to return
        } else result.laterOn.push(friend);
    });
    return result;
}

function categorizeBirthday(dob: Date) {
    const currentDate = moment();
    const currentMonth = currentDate.month() + 1;
  
    const birthdayDate = moment(dob);
    const birthdayMonth = birthdayDate.month() + 1;
  
    // calculate start and end dates of calendar week
    const currentWeekStartDate = currentDate.clone().startOf('week');
    const currentWeekEndDate = currentDate.clone().endOf('week');  

    // check if dob falls within calendar week
    if ( (birthdayDate.isSameOrAfter(currentWeekStartDate) && birthdayDate.isSameOrBefore(currentWeekEndDate)) ||
        (currentWeekStartDate.month() !== currentWeekEndDate.month() &&
          ((birthdayDate.month() === currentWeekStartDate.month() && birthdayDate.date() >= currentWeekStartDate.date()) ||
            (birthdayDate.month() === currentWeekEndDate.month() && birthdayDate.date() <= currentWeekEndDate.date())))
      ) return 'thisWeek'; // if yes, return week category
    else if (currentMonth === birthdayMonth) return 'thisMonth'; // if no, return month category
}

export function daysUntilBirthday(dob: Date, timezone: string) {
    // convert dob to string to parse
    const dobString = dob.toISOString().slice(0, 10);

    // find birthday and current
    const birthday = moment.tz(dobString, 'YYYY-MM-DD', timezone);
    const now = moment.tz(timezone);

    birthday.year(now.year()); // set birthday to this year

    if (now.isAfter(birthday)) { // if the birthday passed...
        birthday.add(1, 'year'); // add 1 to the year
    }

    // calculate difference between now and birthday,
    const daysUntilBirthday = birthday.diff(now, 'days') + 1; // add 1 due to how moment.tz subtracts

    return daysUntilBirthday;
}

const presentlyCardColors: string[] = [
    "#FE6797",
    "#418BFA",
    "#EDB600",
    "#FA7F39",
    "#53CF85",
    "#FE6797",
    "#418BFA",
    "#EDB600",
    "#FA7F39",
    "#53CF85",
    "#FE6797",
    "#418BFA",
    "#EDB600",
    "#FA7F39",
    "#53CF85",
    "#FE6797",
    "#418BFA",
    "#EDB600",
    "#FA7F39",
    "#53CF85",
];