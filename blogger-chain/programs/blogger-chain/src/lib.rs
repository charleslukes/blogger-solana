use anchor_lang::prelude::*;

declare_id!("9yPq5AGoCoBcaNhMyqFqZ7DTZdqm5hyr9CmU48VSE6cG");

#[program]
pub mod blogger_chain {
    use super::*;

    pub fn post_blog(ctx: Context<Blog>, blog_id: u64, title: String, image_url: String, details: String, tags: Vec<u8>) -> Result<()> {
        let blog = &mut ctx.accounts.blog_state;
        blog.blog_id = blog_id;
        blog.author = ctx.accounts.signer.key();
        blog.title = title;
        blog.image_url = image_url;
        blog.details = details;
        blog.tags = tags;
        msg!("Blog created");
        Ok(())
    }

    pub fn edit_blog(ctx: Context<Blog>, blog_id: u64, title: String, image_url: String, details: String, tags: Vec<u8>) -> Result<()>{
        let blog = &mut ctx.accounts.blog_state;
        if blog.author == ctx.accounts.signer.key() {
            blog.blog_id = blog_id;
            blog.title = title;
            blog.image_url = image_url;
            blog.details = details;
            blog.tags = tags;
            msg!("Blog edited");
            Ok(())
        } else {
            err!(BlogErr::NotAuthor)
        }

    }
}

#[account]
pub struct BlogState {
    pub title: String, 
    pub image_url: String, 
    pub blog_id: u64,
    pub details: String, 
    pub tags: Vec<u8>, 
    pub author: Pubkey,
}

#[derive(Accounts)]
#[instruction(blog_id: u64)]
pub struct Blog<'info> {
    #[account(
        init_if_needed,
        payer = signer, 
        space = 500, 
        seeds = [b"blog", blog_id.to_le_bytes().as_ref(), signer.key().as_ref()],
        bump
    )]
    pub blog_state: Box<Account<'info, BlogState>>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[error_code]
pub enum BlogErr {
    #[msg("Only author can update")]
    NotAuthor
}