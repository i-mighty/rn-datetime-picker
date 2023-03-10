import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import localizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";
import isBetween from "dayjs/plugin/isBetween";
import dayOfYear from "dayjs/plugin/dayOfYear";
import weekOfYear from "dayjs/plugin/weekOfYear";
import advancedFormat from "dayjs/plugin/advancedFormat";
import localeData from "dayjs/plugin/localeData";
import "dayjs/locale/en";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(isBetween);
dayjs.extend(dayOfYear);
dayjs.extend(weekOfYear);
dayjs.extend(advancedFormat);
dayjs.extend(localeData);

dayjs.locale("en");

import DatePicker from "./components/DatePicker";
import TimePicker from "./components/TimePicker";
import DateTimePicker from "./components/DateTimePicker";
import DateTimePickerModal from "./components/DateTimePickerModal";

export { DatePicker, TimePicker, DateTimePicker, DateTimePickerModal };
