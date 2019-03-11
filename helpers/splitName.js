
/**
 * @description This function splits fullname into first and last names
 * @param {*} fullName Full name string to be split
 * @returns {object} An object of the split names
 */

function splitName(fullName) {
    const names = fullName.name;
    const splitNames = names.split(' ', 2);
    const splitNamesObject = { firstname: splitNames[0], lastname: splitNames[1] };
    return splitNamesObject;
}

export default splitName;