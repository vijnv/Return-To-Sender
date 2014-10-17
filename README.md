Return-To-Sender
================

Chrome extension for displaying pretty delivery status notifications in Gmail. Turns the technical messages you receive when an e-mail can't be delivered into an understandable message.

### Known limitations: ###

- This extension only parses error messages from mailer-daemon@google.com. Error messages generated by the mail server from an external account you might have added to Gmail won't be parsed at this time.
- The extension only recognizes a small amount of most-common errors currently. Please help me extend this list by pressing the 'feedback' button on any unknown errors
- I haven't tested this extension together with other Gmail extensions such as Streak or Boomerang. Please let me know if you run into any unexpected behaviour after installing this extension.
- If you press 'resend e-mail' button, any attachments present in the original message won't be included in the new e-mail you're composing

### To do: ###
- Create a dialogue window for the feedback button that shows you what information is being send to me and allows you to add additional comments. Currently the button forwards the error message (without the original e-mail) directly without the possibility of viewing it first.