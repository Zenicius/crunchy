//npm
import React from 'react';
//ui
import {Comment} from 'semantic-ui-react';

export default ({commentData}) => {
  return (
    <Comment>
      <Comment.Avatar src={commentData.user.thumb} />
      <Comment.Content>
        <Comment.Author as="a">{commentData.user.name}</Comment.Author>
        <Comment.Metadata>
          <div>{commentData.comment.formattedTimeCreated}</div>
        </Comment.Metadata>
        <Comment.Text>{commentData.comment.body}</Comment.Text>
      </Comment.Content>
    </Comment>
  );
};
