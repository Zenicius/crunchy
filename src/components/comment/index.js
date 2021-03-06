//npm
import React from 'react';
//ui
import {Comment, Divider} from 'semantic-ui-react';

export default ({commentData}) => {
  return (
    <div>
      <Comment>
        <Comment.Avatar src={commentData.user.thumb} />
        <Comment.Content>
          <Comment.Author>{commentData.user.name}</Comment.Author>
          <Comment.Metadata>
            <div>{commentData.comment.formattedTimeCreated}</div>
          </Comment.Metadata>
          <Comment.Text>{commentData.comment.body}</Comment.Text>
        </Comment.Content>
      </Comment>
      <Divider />
    </div>
  );
};
