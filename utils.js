const isUserInContacts = (user, contacts) => {
    console.log(user, contacts);
    // eslint-disable-next-line implicit-arrow-linebreak
    contacts.some((contact) => user.phone === contact.phone);
};

export default isUserInContacts;
